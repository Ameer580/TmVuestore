<template>
  <button
    type="button"
    class="relative bg-cl-transparent brdr-none inline-flex cart"
    @click="openMicrocart"
    data-testid="openMicrocart"
    :aria-label="$t('Open microcart')"
  >
    <!-- <i class="material-icons">shopping_cart</i> -->
    <img src="/assets/icons/basket.svg" />
    <span
      class="minicart-count absolute flex center-xs middle-xs border-box py0 px2 h6 lh16 weight-700 cl-white"
      v-cloak
      v-show="totalQuantity"
      data-testid="minicartCount"
      >{{ totalItems.length }}</span
    >
    <span
      class="price"
      id="microcartIconPrice"
      v-if="getTotals[0].code == 'subtotal' && totalItems.length != 0"
      >{{ getTotals[0].value | price }}</span
    >
    <span class="price" id="microcartIconPrice"></span>
  </button>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import MicrocartIcon from "@vue-storefront/core/compatibility/components/blocks/Header/MicrocartIcon";
import { syncCartWhenLocalStorageChange } from "@vue-storefront/core/modules/cart/helpers";

export default {
  mounted() {
    syncCartWhenLocalStorageChange.addEventListener();
    this.$once("hook:beforeDestroy", () => {
      syncCartWhenLocalStorageChange.removeEventListener();
    });
  },
  computed: {
    ...mapGetters({
      totalQuantity: "cart/getItemsTotalQuantity",
      totalItems: "cart/getCartItems",
      getTotals: "cart/getTotals"
    })
  },
  methods: {
    ...mapActions({
      openMicrocart: "ui/toggleMicrocart"
    })
  }
};
</script>
<style scoped>
.minicart-count {
  top: 34px;
  left: 15%;
  min-width: 20px;
  min-height: 20px;
  border-radius: 10px;
  background-color: #ed108c;
}
.cart {
  padding: 15.3px 10px 20px 5px;
  /* border: 2px solid #fff;
  border-right: none;
  border-top: none;
  border-bottom: none; */
  width: auto;
  margin-right: -6px;
  position: relative;
  display: flex;
  min-width: 105px;
  /* justify-content: center; */
}
img {
  height: 27px;
  margin-top: 20px;
}
.price {
  margin-top: 30px;
  margin-left: 10px;
  font-size: 18px;
  font-weight: bold;
  color: #29275b;
}
@media (min-width: 768px) and (max-width: 1199px) {
  /* .cart img {
    margin-top: 6px;
  } */
  .minicart-count {
    top: 18px;
    left: 16%;
  }
  /* .price {
    margin-top: 10px;
  } */
}
@media (max-width: 767px) {
  .cart {
    width: auto;
    margin-right: 7px;
    padding: 20px 22px 20px 0px;
    display: flex;
    align-items: center;
    flex-direction: column;
  }
  .cart img {
    margin-top: -7px;
    margin-left: 15px;
  }
  .minicart-count {
    top: 10px;
    left: 50%;
  }
  .price {
    /* font-weight: 100;
    text-align: center;
    margin-left: 7px;
    position: absolute;
    top: 39px; */
    display: none;
  }
}
@media (max-width: 423px) {
  .cart {
    /* padding: 20px 15px 20px 0px; */
  }
  .cart img {
    height: 29px;
  }
}
</style>
