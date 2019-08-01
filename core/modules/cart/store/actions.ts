import { ActionTree } from 'vuex'
import * as types from './mutation-types'
import i18n from '@vue-storefront/i18n'
import { currentStoreView, localizedRoute } from '@vue-storefront/core/lib/multistore'
import RootState from '@vue-storefront/core/types/RootState'
import CartState from '../types/CartState'
import isString from 'lodash-es/isString'
import toString from 'lodash-es/toString'
import { Logger } from '@vue-storefront/core/lib/logger'
import { TaskQueue } from '@vue-storefront/core/lib/sync'
import { router } from '@vue-storefront/core/app'
import SearchQuery from '@vue-storefront/core/lib/search/searchQuery'
import { isServer } from '@vue-storefront/core/helpers'
import config from 'config'
import Task from '@vue-storefront/core/lib/sync/types/Task'
import EventBus from '@vue-storefront/core/compatibility/plugins/event-bus'
import { StorageManager } from '@vue-storefront/core/lib/storage-manager'
import { configureProductAsync } from '@vue-storefront/core/modules/catalog/helpers'
import { CartService } from '@vue-storefront/core/data-resolver'
import {
  prepareProductsToAdd,
  productsEquals,
  preparePaymentMethodsToSync,
  validateProduct,
  createDiffLog,
  isCartTokenAuthorized,
  notifications
} from './../helpers'
import CartItem from '../types/CartItem';

function _getDifflogPrototype () {
  return { items: [], serverResponses: [], clientNotifications: [] }
}

/** @todo: move this metod to data resolver; shouldn't be a part of public API no more */
async function _serverShippingInfo ({ methodsData }) {
  const task = await TaskQueue.execute({ url: config.cart.shippinginfo_endpoint,
    payload: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      mode: 'cors',
      body: JSON.stringify({
        addressInformation: {
          shippingAddress: {
            countryId: methodsData.country
          },
          shippingCarrierCode: methodsData.carrier_code,
          shippingMethodCode: methodsData.method_code
        }
      })
    },
    silent: true
  })
  return task
}

/** @todo: move this metod to data resolver; shouldn't be a part of public API no more */
async function _serverTotals (): Promise<Task> {
  return TaskQueue.execute({ url: config.cart.totals_endpoint, // sync the cart
    payload: {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      mode: 'cors'
    },
    silent: true
  })
}

/** @todo: move this metod to data resolver; shouldn't be a part of public API no more */
function _serverDeleteItem ({ cartServerToken, cartItem }): Promise<Task> {
  if (!cartItem.quoteId) {
    cartItem = Object.assign(cartItem, { quoteId: cartServerToken })
  }
  cartItem = Object.assign(cartItem, { quoteId: cartServerToken })
  return TaskQueue.execute({ url: config.cart.deleteitem_endpoint, // sync the cart
    payload: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      mode: 'cors',
      body: JSON.stringify({
        cartItem: cartItem
      })
    },
    silent: true
  })
}

const actions: ActionTree<CartState, RootState> = {
  async disconnect ({ commit }) {
    commit(types.CART_LOAD_CART_SERVER_TOKEN, null)
  },
  async clear ({ commit, dispatch, getters }, options = { recreateAndSyncCart: true }) {
    await commit(types.CART_LOAD_CART, [])
    if (options.recreateAndSyncCart && getters.isCartSyncEnabled) {
      await commit(types.CART_LOAD_CART_SERVER_TOKEN, null)
      await commit(types.CART_SET_ITEMS_HASH, null)
      await dispatch('connect', { guestCart: !config.orders.directBackendSync }) // guest cart when not using directBackendSync because when the order hasn't been passed to Magento yet it will repopulate your cart
    }
  },
  async syncPaymentMethods ({ getters, rootGetters, dispatch }, { forceServerSync = false }) {
    if (getters.canUpdateMethods && (getters.isTotalsSyncRequired || forceServerSync)) {
      Logger.debug('Refreshing payment methods', 'cart')()
      const { result } = await CartService.getPaymentMethods()
      const { uniqueBackendMethods, paymentMethods } = preparePaymentMethodsToSync(
        result,
        rootGetters['payment/getNotServerPaymentMethods']
      )
      await dispatch('payment/replaceMethods', paymentMethods, { root: true })
      EventBus.$emit('set-unique-payment-methods', uniqueBackendMethods)
    } else {
      Logger.debug('Payment methods does not need to be updated', 'cart')()
    }
  },
  async updateShippingMethods ({ dispatch }, { shippingMethods }) {
    if (shippingMethods.length > 0) {
      const newShippingMethods = shippingMethods.map(method => ({ ...method, is_server_method: true }))
      await dispatch('shipping/replaceMethods', newShippingMethods, { root: true })
    }
  },
  async syncShippingMethods ({ getters, rootGetters, dispatch }, { forceServerSync = false }) {
    if (getters.canUpdateMethods && (getters.isTotalsSyncRequired || forceServerSync)) {
      const storeView = currentStoreView()
      Logger.debug('Refreshing shipping methods', 'cart')()
      const { result } = await CartService.getShippingMethods({
        country_id: rootGetters['checkout/getShippingDetails'].country || storeView.tax.defaultCountry
      })
      await dispatch('updateShippingMethods', { shippingMethods: result })
    } else {
      Logger.debug('Shipping methods does not need to be updated', 'cart')()
    }
  },
  async sync ({ getters, rootGetters, commit, dispatch }, { forceClientState = false, dryRun = false }) {
    const shouldUpdateClientState = rootGetters['checkout/isUserInCheckout'] || forceClientState
    const { getCartItems, canUpdateMethods, isSyncRequired, bypassCounter } = getters
    if (!canUpdateMethods || !isSyncRequired) return

    commit(types.CART_SET_SYNC)
    const { result, resultCode } = await CartService.pullCart()
    if (resultCode === 200) {
      return dispatch('merge', {
        dryRun,
        serverItems: result,
        clientItems: getCartItems,
        forceClientState: shouldUpdateClientState
      })
    }

    if (bypassCounter < config.queues.maxCartBypassAttempts) {
      Logger.log('Bypassing with guest cart' + bypassCounter, 'cart')()
      commit(types.CART_UPDATE_BYPASS_COUNTER, { counter: 1 })
      await dispatch('connect', { guestCart: true })
    }

    Logger.error(result, 'cart')
    return createDiffLog()
  },
  /** @deprecated backward compatibility only */
  async serverPull ({ dispatch }, { forceClientState = false, dryRun = false }) {
    Logger.warn('The "cart/serverPull" action is deprecated and will not be supported with the Vue Storefront 1.11', 'cart')()
    return dispatch('sync', { forceClientState, dryRun })
  },
  async setDefaultCheckoutMethods ({ getters, rootGetters, commit }) {
    if (!getters.getShippingMethodCode) {
      commit(types.CART_UPD_SHIPPING, rootGetters['shipping/getDefaultShippingMethod'])
    }

    if (!getters.getPaymentMethodCode) {
      commit(types.CART_UPD_PAYMENT, rootGetters['payment/getDefaultPaymentMethod'])
    }
  },
  async synchronizeCart ({ commit, dispatch }, { forceClientState }) {
    const { synchronize, serverMergeByDefault } = config.cart
    if (!synchronize) return
    const cartStorage = StorageManager.get('cart')
    const token = await cartStorage.getItem('current-cart-token')
    const hash = await cartStorage.getItem('current-cart-hash')

    if (hash) {
      commit(types.CART_SET_ITEMS_HASH, hash)
      Logger.info('Cart hash received from cache.', 'cache', hash)()
    }
    if (token) {
      commit(types.CART_LOAD_CART_SERVER_TOKEN, token)
      Logger.info('Cart token received from cache.', 'cache', token)()
      Logger.info('Syncing cart with the server.', 'cart')()
      dispatch('sync', { forceClientState, dryRun: !serverMergeByDefault })
    } else {
      Logger.info('Creating server cart token', 'cart')()
      await dispatch('connect', { guestCart: false })
    }
  },
  async load ({ commit, dispatch }, { forceClientState = false }: {forceClientState?: boolean} = {}) {
    if (isServer) return

    dispatch('setDefaultCheckoutMethods')
    const storedItems = await StorageManager.get('cart').getItem('current-cart')
    commit(types.CART_LOAD_CART, storedItems)
    dispatch('synchronizeCart', { forceClientState })
  },
  getItem ({ getters }, { product }) {
    return getters.getCartItems.find(p => productsEquals(p, product))
  },
  goToCheckout () {
    router.push(localizedRoute('/checkout', currentStoreView().storeCode))
  },
  async addItem ({ dispatch }, { productToAdd, forceServerSilence = false }) {
    return dispatch('addItems', { productsToAdd: prepareProductsToAdd(productToAdd), forceServerSilence })
  },
  async checkProductStatus ({ dispatch, getters }, { product }) {
    const record = getters.getCartItems.find(p => productsEquals(p, product))
    const qty = record ? record.qty + 1 : (product.qty ? product.qty : 1)

    return dispatch('stock/queueCheck', { product, qty }, {root: true})
  },
  async addItems ({ commit, dispatch, getters }, { productsToAdd, forceServerSilence = false }) {
    let productIndex = 0
    const diffLog = createDiffLog()
    for (let product of productsToAdd) {
      const errors = validateProduct(product)
      diffLog.pushNotifications(notifications.createNotifications({ type: 'error', messages: errors }))

      if (errors.length === 0) {
        const { status, onlineCheckTaskId } = await dispatch('checkProductStatus', { product })

        if (status === 'volatile') {
          diffLog.pushNotification(notifications.unsafeQuantity)
        }
        if (status === 'out_of_stock') {
          diffLog.pushNotification(notifications.outOfStock)
        }

        if (status === 'ok' || status === 'volatile') {
          commit(types.CART_ADD_ITEM, {
            product: { ...product, onlineStockCheckid: onlineCheckTaskId }
          })
        }
        if (productIndex === (productsToAdd.length - 1) && (!getters.isCartSyncEnabled || forceServerSilence)) {
          diffLog.pushNotification(notifications.productAddedToCart)
        }
        productIndex++
      }
    }
    if (getters.isCartSyncEnabled && getters.isCartConnected && !forceServerSilence) {
      return dispatch('sync', { forceClientState: true })
    }

    return diffLog
  },
  async removeItem ({ commit, dispatch, getters }, payload) {
    const removeByParentSku = payload.product ? !!payload.removeByParentSku && payload.product.type_id !== 'bundle' : true
    const product = payload.product || payload

    commit(types.CART_DEL_ITEM, { product, removeByParentSku })
    if (getters.isCartSyncEnabled && product.server_item_id) {
      return dispatch('sync', { forceClientState: true })
    }

    return createDiffLog()
      .pushClientParty({ status: 'no-item', sku: product.sku })
  },
  async updateQuantity ({ commit, dispatch, getters }, { product, qty, forceServerSilence = false }) {
    commit(types.CART_UPD_ITEM, { product, qty })
    if (getters.isCartSyncEnabled && product.server_item_id && !forceServerSilence) {
      return dispatch('sync', { forceClientState: true })
    }

    return createDiffLog()
      .pushClientParty({ status: 'wrong-qty', sku: product.sku, 'client-qty': qty })
  },
  configureItem (context, { product, configuration }) {
    const { commit, dispatch, getters } = context
    const variant = configureProductAsync(context, {
      product,
      configuration,
      selectDefaultVariant: false
    })
    const itemWithSameSku = getters.getCartItems.find(item => item.sku === variant.sku)

    if (itemWithSameSku && product.sku !== variant.sku) {
      Logger.debug('Item with the same sku detected', 'cart', { sku: itemWithSameSku.sku })()
      commit(types.CART_DEL_ITEM, { product: itemWithSameSku })
      product.qty = parseInt(product.qty) + parseInt(itemWithSameSku.qty)
    }

    commit(types.CART_UPD_ITEM_PROPS, { product: { ...product, ...variant } })

    if (getters.isCartSyncEnabled && product.server_item_id) {
      dispatch('sync', { forceClientState: true })
    }
  },
  updateItem ({ commit }, { product }) {
    commit(types.CART_UPD_ITEM_PROPS, { product })
  },
  async syncTotals ({ dispatch, commit, getters, rootGetters }, payload: { forceServerSync: boolean, methodsData?: any } = { forceServerSync: false, methodsData: null }) {
    let methodsData = payload ? payload.methodsData : null
    /** helper method to update the UI */
    const _afterTotals = async (task) => {
      if (task.resultCode === 200) {
        const totalsObj = task.result.totals ? task.result.totals : task.result
        Logger.info('Overriding server totals. ', 'cart', totalsObj)()
        const itemsAfterTotal = {}
        const platformTotalSegments = totalsObj.total_segments
        for (let item of totalsObj.items) {
          if (item.options && isString(item.options)) item.options = JSON.parse(item.options)
          itemsAfterTotal[item.item_id] = item
          await dispatch('updateItem', { product: { server_item_id: item.item_id, totals: item, qty: item.qty } }) // update the server_id reference
        }
        commit(types.CART_UPD_TOTALS, { itemsAfterTotal: itemsAfterTotal, totals: totalsObj, platformTotalSegments: platformTotalSegments })
        commit(types.CART_SET_TOTALS_SYNC)
      } else {
        Logger.error(task.result, 'cart')()
      }
    }
    if (getters.isTotalsSyncRequired || payload.forceServerSync) {
      await Promise.all([
        dispatch('syncShippingMethods', { forceServerSync: !!payload.forceServerSync }), // pull the shipping and payment methods available for the current cart content
        dispatch('syncPaymentMethods', { forceServerSync: !!payload.forceServerSync }) // pull the shipping and payment methods available for the current cart content
      ])
    } else {
      Logger.debug('Skipping payment & shipping methods update as cart has not been changed', 'cart')()
    }
    const storeView = currentStoreView()
    let hasShippingInformation = false
    if (getters.isTotalsSyncEnabled && getters.isCartConnected && (getters.isTotalsSyncRequired || payload.forceServerSync)) {
      if (!methodsData) {
        const country = rootGetters['checkout/getShippingDetails'].country ? rootGetters['checkout/getShippingDetails'].country : storeView.tax.defaultCountry
        const shippingMethods = rootGetters['shipping/shippingMethods']
        const paymentMethods = rootGetters['payment/paymentMethods']
        let shipping = shippingMethods && Array.isArray(shippingMethods) ? shippingMethods.find(item => item.default && !item.offline /* don't sync offline only shipping methods with the serrver */) : null
        let payment = paymentMethods && Array.isArray(paymentMethods) ? paymentMethods.find(item => item.default) : null
        if (!shipping && shippingMethods && shippingMethods.length > 0) {
          shipping = shippingMethods.find(item => !item.offline)
        }
        if (!payment && paymentMethods && paymentMethods.length > 0) {
          payment = paymentMethods[0]
        }
        methodsData = {
          country: country
        }
        if (shipping) {
          if (shipping.method_code) {
            hasShippingInformation = true // there are some edge cases when the backend returns no shipping info
            methodsData['method_code'] = shipping.method_code
          }
          if (shipping.carrier_code) {
            hasShippingInformation = true
            methodsData['carrier_code'] = shipping.carrier_code
          }
        }
        if (payment && payment.code) methodsData['payment_method'] = payment.code
      }
      if (methodsData.country && getters.isCartConnected) {
        if (hasShippingInformation) {
          return _serverShippingInfo({ methodsData }).then(_afterTotals)
        } else {
          return _serverTotals().then(_afterTotals)
        }
      } else {
        Logger.error('Please do set the tax.defaultCountry in order to calculate totals', 'cart')()
      }
    }
  },
  async refreshTotals ({ dispatch }, payload) {
    Logger.warn('The "cart/refreshTotals" action is deprecated and will not be supported with the Vue Storefront 1.11', 'cart')()
    return dispatch('syncTotals', payload)
  },
  async removeCoupon ({ getters, dispatch }) {
    if (getters.isTotalsSyncEnabled && getters.isCartConnected) {
      const { result } = await CartService.removeCoupon()

      if (result) {
        dispatch('syncTotals', { forceServerSync: true })
        return result
      }
    }
  },
  async applyCoupon ({ getters, dispatch }, couponCode) {
    if (couponCode && getters.isTotalsSyncEnabled && getters.isCartConnected) {
      const { result } = await CartService.applyCoupon(couponCode)

      if (result) {
        dispatch('syncTotals', { forceServerSync: true })
      }
      return result
    }
  },
  async authorize ({ dispatch, getters }) {
    const coupon = getters.getCoupon.code
    const lastCartBypassTs = await StorageManager.get('user').getItem('last-cart-bypass-ts')
    const timeBypassCart = config.orders.directBackendSync || (Date.now() - lastCartBypassTs) >= (1000 * 60 * 24)

    if (!config.cart.bypassCartLoaderForAuthorizedUsers || timeBypassCart) {
      await dispatch('connect', { guestCart: false })

      if (!getters.getCoupon) {
        await dispatch('applyCoupon', coupon)
      }
    }
  },
  async connect ({ getters, dispatch, commit }, { guestCart = false, forceClientState = false }) {
    if (!getters.isCartSyncEnabled) return
    const { result, resultCode } = await CartService.connectCart(guestCart, forceClientState)

    if (resultCode === 200) {
      Logger.info('Server cart token created.', 'cart', result)()
      commit(types.CART_LOAD_CART_SERVER_TOKEN, result)

      return dispatch('sync', { forceClientState, dryRun: !config.cart.serverMergeByDefault })
    }

    if (isCartTokenAuthorized(result) && getters.bypassCounter < config.queues.maxCartBypassAttempts) {
      Logger.log('Bypassing with guest cart' + getters.bypassCounter, 'cart')()
      commit(types.CART_UPDATE_BYPASS_COUNTER, { counter: 1 })
      Logger.error(result, 'cart')()
      return dispatch('connect', { guestCart: true })
    }

    Logger.warn('Cart sync is disabled by the config', 'cart')()
    return createDiffLog()
  },
  async restoreQuantity ({ dispatch }, { cartItem, clientItem }) {
    const currentCartItem = await dispatch('getItem', clientItem)
    if (currentCartItem) {
      Logger.log('Restoring qty after error' + clientItem.sku + currentCartItem.prev_qty, 'cart')()
      if (cartItem.prev_qty > 0) {
        dispatch('updateItem', { product: { qty: currentCartItem.prev_qty } })
        EventBus.$emit('cart-after-itemchanged', { item: currentCartItem })
      } else {
        dispatch('removeItem', { product: currentCartItem, removeByParentSku: false })
      }
    }
  },
  async updateClientItem ({ dispatch }, { clientItem, serverItem }) {
    const cartItem = clientItem === null ? await dispatch('getItem', serverItem) : clientItem

    if (!cartItem || typeof serverItem.item_id === 'undefined') return

    const product = {
      server_item_id: serverItem.item_id,
      sku: cartItem.sku,
      server_cart_id: serverItem.quote_id,
      prev_qty: cartItem.qty,
      product_option: serverItem.product_option,
      type_id: serverItem.product_type
    }

    await dispatch('updateItem', { product })
    EventBus.$emit('cart-after-itemchanged', { item: cartItem })
  },
  async updateServerItem ({ getters, rootGetters, commit, dispatch }, { cartItem, clientItem, serverItem }) {
    const diffLog = createDiffLog()
    const event = await CartService.updateCartItem(getters.getCartToken, cartItem)
    const isUpdateSuccess = event.resultCode === 200
    Logger.debug('Cart item server sync' + event, 'cart')()
    diffLog.pushServerResponse({ 'status': event.resultCode, 'sku': clientItem.sku, 'result': event })

    if (!isUpdateSuccess && !serverItem) {
      commit(types.CART_DEL_ITEM, { product: clientItem, removeByParentSku: false })
      return diffLog
    }

    if (!isUpdateSuccess && clientItem.item_id) {
      await dispatch('restoreQuantity', { cartItem, clientItem })
      return diffLog
    }

    if (!isUpdateSuccess) {
      Logger.warn('Removing product from cart', 'cart', clientItem)()
      commit(types.CART_DEL_NON_CONFIRMED_ITEM, { product: clientItem })
      return diffLog
    }

    if (!rootGetters['checkout/isUserInCheckout']) {
      const isThisNewItemAddedToTheCart = (!clientItem || !clientItem.server_item_id)
      diffLog.pushNotification(
        isThisNewItemAddedToTheCart ? notifications.productAddedToCart : notifications.productQuantityUpdated
      )
    }

    await dispatch('updateClientItem', { clientItem, serverItem: event.result })

    return diffLog
  },
  async merge ({ getters, dispatch, commit }, { serverItems, clientItems, dryRun = false, forceClientState = false }) {
    const diffLog = createDiffLog()
    let totalsShouldBeRefreshed = getters.isTotalsSyncRequired // when empty it means no sync has yet been executed
    let serverCartUpdateRequired = false
    let clientCartUpdateRequired = false
    let cartHasItems = false
    const clientCartAddItems = []

    /** helper to find the item to be added to the cart by sku */
    let productActionOptions = (serverItem) => {
      return new Promise(resolve => {
        if (serverItem.product_type === 'configurable') {
          let searchQuery = new SearchQuery()
          searchQuery = searchQuery.applyFilter({key: 'configurable_children.sku', value: {'eq': serverItem.sku}})
          dispatch('product/list', {query: searchQuery, start: 0, size: 1, updateState: false}, { root: true }).then((resp) => {
            if (resp.items.length >= 1) {
              resolve({ sku: resp.items[0].sku, childSku: serverItem.sku })
            }
          })
        } else {
          resolve({ sku: serverItem.sku })
        }
      })
    }

    for (const clientItem of clientItems) {
      cartHasItems = true

      const serverItem = serverItems.find(itm => productsEquals(itm, clientItem))

      if (!serverItem) {
        Logger.warn('No server item with sku ' + clientItem.sku + ' on stock.', 'cart')()
        diffLog.pushServerParty({ sku: clientItem.sku, status: 'no-item' })
        if (!dryRun) {
          if (forceClientState || !config.cart.serverSyncCanRemoveLocalItems) {
            const updateServerItemDiffLog = await dispatch(
              'updateServerItem',
              {
                clientItem,
                serverItem,
                cartItem: {
                  sku: clientItem.parentSku && config.cart.setConfigurableProductOptions ? clientItem.parentSku : clientItem.sku,
                  qty: clientItem.qty,
                  product_option: clientItem.product_option
                }
              }
            )
            diffLog.merge(updateServerItemDiffLog)
            serverCartUpdateRequired = true
            totalsShouldBeRefreshed = true
          } else {
            dispatch('removeItem', {
              product: clientItem
            })
          }
        }
      } else if (serverItem.qty !== clientItem.qty) {
        Logger.log('Wrong qty for ' + clientItem.sku, clientItem.qty, serverItem.qty)()
        diffLog.pushServerParty({ sku: clientItem.sku, status: 'wrong-qty', 'client-qty': clientItem.qty, 'server-qty': serverItem.qty })
        if (!dryRun) {
          if (forceClientState || !config.cart.serverSyncCanModifyLocalItems) {
            const updateServerItemDiffLog = await dispatch(
              'updateServerItem',
              {
                clientItem,
                serverItem,
                cartItem: {
                  sku: clientItem.parentSku && config.cart.setConfigurableProductOptions ? clientItem.parentSku : clientItem.sku,
                  qty: clientItem.qty,
                  item_id: serverItem.item_id,
                  quoteId: serverItem.quote_id,
                  product_option: clientItem.product_option
                }
              }
            )
            diffLog.merge(updateServerItemDiffLog)

            totalsShouldBeRefreshed = true
            serverCartUpdateRequired = true
          } else {
            await dispatch('updateItem', {
              product: serverItem
            })
          }
        }
      } else {
        Logger.info('Server and client item with SKU ' + clientItem.sku + ' synced. Updating cart.', 'cart', 'cart')()
        if (!dryRun) {
          await dispatch('updateItem', {
            product: {
              sku: clientItem.sku,
              server_cart_id: serverItem.quote_id,
              server_item_id: serverItem.item_id,
              product_option: serverItem.product_option,
              type_id: serverItem.product_type
            }
          })
        }
      }
    }

    for (const serverItem of serverItems) {
      if (serverItem) {
        const clientItem = clientItems.find(itm => productsEquals(itm, serverItem))
        if (!clientItem) {
          Logger.info('No client item for' + serverItem.sku, 'cart')()
          diffLog.pushClientParty({ sku: serverItem.sku, status: 'no-item' })

          if (!dryRun) {
            if (forceClientState) {
              Logger.info('Removing product from cart', 'cart', serverItem)()
              Logger.log('Removing item' + serverItem.sku + serverItem.item_id, 'cart')()
              serverCartUpdateRequired = true
              totalsShouldBeRefreshed = true
              const res = await _serverDeleteItem({
                cartServerToken: getters.getCartToken,
                cartItem: {
                  sku: serverItem.sku,
                  item_id: serverItem.item_id,
                  quoteId: serverItem.quote_id
                }
              })
              diffLog.pushServerResponse({ status: res.resultCode, sku: serverItem.sku, result: res })
            } else {
              clientCartAddItems.push(
                new Promise(resolve => {
                  productActionOptions(serverItem).then((actionOtions) => {
                    dispatch('product/single', { options: actionOtions, assignDefaultVariant: true, setCurrentProduct: false, selectDefaultVariant: false }, { root: true }).then((product) => {
                      resolve({ product: product, serverItem: serverItem })
                    })
                  })
                })
              )
            }
          }
        }
      }
    }
    if (clientCartAddItems.length) {
      totalsShouldBeRefreshed = true
      clientCartUpdateRequired = true
      cartHasItems = true
    }
    diffLog.pushClientParty({ status: clientCartUpdateRequired ? 'update-required' : 'no-changes' })
    diffLog.pushServerParty({ status: serverCartUpdateRequired ? 'update-required' : 'no-changes' })
    Promise.all(clientCartAddItems).then((items) => {
      items.map(({ product, serverItem }) => {
        product.server_item_id = serverItem.item_id
        product.qty = serverItem.qty
        product.server_cart_id = serverItem.quote_id
        if (serverItem.product_option) {
          product.product_option = serverItem.product_option
        }
        dispatch('addItem', { productToAdd: product, forceServerSilence: true })
      })
    })

    if (!dryRun) {
      if (totalsShouldBeRefreshed && cartHasItems) {
        await dispatch('syncTotals')
      }
      commit(types.CART_SET_ITEMS_HASH, getters.getCurrentCartHash) // update the cart hash
    }
    EventBus.$emit('servercart-after-diff', { diffLog: diffLog, serverItems: serverItems, clientItems: clientItems, dryRun: dryRun, event: event }) // send the difflog
    Logger.info('Client/Server cart synchronised ', 'cart', diffLog)()
    return diffLog
  },
  toggleMicrocart ({ commit }) {
    commit(types.CART_TOGGLE_MICROCART)
  }
}

export default actions
