<template>
  <div class="searchbar-show">
    <div
      class="searchpanel"
      data-testid="searchPanel"
      v-closable="hideSearchPanel"
    >
      <!-- <div class="close-icon-row">
<i
class="material-icons pointer cl-accent close-icon"
@click="closeSearchpanel"
data-testid="closeSearchPanel"
>close</i>
      </div>-->

      <div class="container">
        <div class="row">
          <div class="col-md-12 col-xs-12 end-xs">
            <label for="search" class="visually-hidden">{{
              $t("Search")
            }}</label>
            <div class="search-input-group">
              <router-link
                :disabled="!search.length > 2"
                :event="search.length > 2 ? 'click' : ''"
                :style="!search.length > 2 ? 'cursor: default' : ''"
                :to="localizedRoute('/catalog-search/?s=' + search)"
                class="search-action-btn"
              >
                <!-- <i class="material-icons search-icon" ref="searchIconRef" @click="iConClick">search</i> -->
              </router-link>
              <form @submit.prevent="onSearchSubmit" class="new-searchformTag">
                <input
                  ref="search"
                  id="search"
                  v-model="search"
                  @input="makeSearch"
                  @blur="$v.search.$touch()"
                  class="search-panel-input"
                  autocomplete="off"
                  :placeholder="$t('Search...')"
                  @keyup="someKeyUpFunction"
                  @click="
                    searchClick();
                    showSearchPanel();
                  "
                  v-on:keyup.enter="onEnter"
                />
              </form>
            </div>
          </div>
        </div>
        <!-- <div
v-if="visibleProducts.length && categories.length > 1"
class="categories"
>
<category-panel
:categories="categories"
v-model="selectedCategoryIds"
/>
        </div>-->
        <div
          id="search-mainmain"
          class="sb-filters dontshow"
          v-if="shouldShowProducts"
        >
          <transition name="fade">
            <div
              v-if="getNoResultsMessage"
              class="no-results relative center-xs h4 col-md-12"
            >
              {{ $t(getNoResultsMessage) }}
            </div>
          </transition>
          <div class="product-listing row">
            <product-tile
              v-for="product in visibleProducts"
              :key="product.id"
              :product="product"
              @click.native="
                hideSearchPanel();
                clearSearchBar();
                onEnter();
              "
            />
          </div>
          <div
            v-show="OnlineOnly && visibleProducts.length >= size"
            class="buttons-set align-center"
          >
            <button
              class="no-outline brdr-none py15 px20 bg-cl-mine-shaft :bg-cl-th-secondary cl-white fs-medium-small"
              type="button"
              @click="
                onSearchSubmit();
                onEnter();
              "
            >
              {{ $t("View All Results") }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="custom-search-icon">
      <a>
        <img src="/assets/icons/search.svg" />
      </a>
    </div>
  </div>
</template>

<script>
import SearchPanel from "@vue-storefront/core/compatibility/components/blocks/SearchPanel/SearchPanel";
import ProductTile from "theme/components/core/ProductTile";
import VueOfflineMixin from "vue-offline/mixin";
import CategoryPanel from "theme/components/core/blocks/Category/CategoryPanel";
import { minLength } from "vuelidate/lib/validators";
// import { disableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock';
export default {
  name: "DesktopSearch",
  methods: {
    onEnter() {
      // this.$refs.searchContainer.classList.add("hide");
      this.$refs.searchContainer.classList.remove("show");
    },
    searchtoggle() {
      // this.searchHidden = !this.searchHidden;
      this.$refs.searchContainer.classList.toggle("show");
    },
    clearSearchBar() {
      this.search = "";
    },
    hideSearchPanel() {
      this.showPanelNewDesktop = false;
    },
    iConClick() {
      this.showPanelNewDesktop = false;
    },
    showSearchPanel() {
      this.showPanelNewDesktop = true;
    },
    someKeyUpFunction() {
      if (document.getElementById("search-mainmain") != null) {
        document.getElementById("search-mainmain").className = "sb-filters";
      }
    },
    searchClick() {
      if (document.getElementById("search-mainmain") != null) {
        document.getElementById("search-mainmain").className = "sb-filters";
      }
    },
    handleViewAllClick() {
      this.clearSearchBar();
      this.hideSearchPanel();
      // Route to search page
      // console.log('searchsearch', this.search);
      // this.$router.replace('/catalog-search/?s=' + this.search);
    },
    onSearchSubmit() {
      console.log("onSearchSubmit", this.search);
      if (this.search.length > 2) {
        this.clearSearchBar();
        this.hideSearchPanel();
        this.$refs.searchIconRef.click();
      }
    }
  },
  directives: {
    closable: {
      bind: function(el, binding, vnode) {
        el.eventSetDrag = function() {
          el.setAttribute("data-dragging", "yes");
        };
        el.eventClearDrag = function() {
          el.removeAttribute("data-dragging");
        };
        el.eventOnClick = function(event) {
          var dragging = el.getAttribute("data-dragging");
          // Check that the click was outside the el and its children, and wasn't a drag
          if (
            !(el === event.target || el.contains(event.target)) &&
            !dragging
          ) {
            // call method provided in attribute value
            vnode.context[binding.expression](event);
          }
        };
        document.addEventListener("touchstart", el.eventClearDrag);
        document.addEventListener("touchmove", el.eventSetDrag);
        document.addEventListener("click", el.eventOnClick);
        document.addEventListener("touchend", el.eventOnClick);
      },
      unbind: function(el) {
        document.removeEventListener("touchstart", el.eventClearDrag);
        document.removeEventListener("touchmove", el.eventSetDrag);
        document.removeEventListener("click", el.eventOnClick);
        document.removeEventListener("touchend", el.eventOnClick);
        el.removeAttribute("data-dragging");
      }
    }
  },
  components: {
    ProductTile
  },
  mixins: [SearchPanel, VueOfflineMixin],
  validations: {
    search: {
      minLength: minLength(3)
    }
  },
  data() {
    return {
      selectedCategoryIds: [],
      showPanelNewDesktop: true,
      searchHidden: false,
      size: 6
    };
  },
  computed: {
    visibleProducts() {
      const productList = this.products || [];
      if (this.selectedCategoryIds.length) {
        return productList.filter(product =>
          product.category_ids.some(categoryId => {
            const catId = parseInt(categoryId);
            return this.selectedCategoryIds.includes(catId);
          })
        );
      }
      return productList;
    },
    shouldShowProducts() {
      return this.visibleProducts.length >= !0 && this.showPanelNewDesktop;
    },
    // categories () {
    // const categories = this.products
    // .filter(p => p.category)
    // .map(p => p.category)
    // .flat();
    // const discinctCategories = Array.from(
    // new Set(categories.map(c => c.category_id))
    // ).map(catId => categories.find(c => c.category_id === catId));
    // return discinctCategories;
    // },
    getNoResultsMessage() {
      let msg = "";
      if (!this.$v.search.minLength) {
        msg = "Searched term should consist of at least 3 characters.";
      } else if (this.emptyResults) {
        msg = "No results were found.";
      }
      return msg;
    }
  },
  watch: {
    categories() {
      this.selectedCategoryIds = [];
    }
  },
  mounted() {
    // add autofocus to search input field
    //this.$refs.search.focus();
    this.search = "";
    // disableBodyScroll(this.$el);
  },
  destroyed() {
    // clearAllBodyScrollLocks();
  }
};
</script>

<style lang="scss" scoped>
@import "~theme/css/animations/transitions";
@import "~theme/css/variables/grid";
@import "~theme/css/variables/typography";
.sb-filters.dontshow {
  display: none;
}

.categories {
  display: none;
}
.custom-search-icon {
  display: none;
}
.searchbar-show {
  margin-top: 3px;
}
.searchpanel {
  visibility: visible;
  position: relative;
  margin-right: 0px;
  .container {
    padding-left: 0px;
    padding-right: 77px;
    .sb-filters {
      position: absolute;
      background-color: #ffff;
      z-index: 9;
      padding: 10px;
      // top: 64px;
      // right: 45px;
      top: 53px;
      right: -14px;
      width: 100%;
      max-width: 521px;
      border: 2px solid #d6de29;
    }
    @media #{$media-xs} {
      padding-left: 30px;
      padding-right: 30px;
    }
    .search-input-group {
      position: relative;
      border: none;
      justify-content: flex-end;
      // padding-top: 1.25rem;
      // padding-top: 0.4rem;
      // margin-top: -5px;
      input {
        max-width: 405px;
        height: 2.63rem;
        /* border-radius: 3px; */
        width: 100%;
        /* border: 1px solid #bfc3cb; */
        font-size: 0.839375rem;
        padding-left: 0.5rem;
        // border: 1px solid #434343;
        /* outline: none; */
        background-color: #e6ebee;
        margin-left: 21px;
        color: #888;
        font-family: sans-serif;
        font-weight: bold;
      }
      .search-icon {
        // position: absolute;
        // right: 10px;
        // top: 10px;
        width: auto;
        height: 100%;
        font-size: 36px;
        color: #d6de29;
        // &::after {
        //   content: "";
        //   border: 1px solid #efefef;
        //   position: absolute;
        //   right: 35px;
        //   top: 20px;
        //   height: 20px;
        // }
      }
    }
  }
  a.underline:after,
  a:not(.no-underline):hover:after {
    content: none;
  }
  .row {
    margin-left: -map-get($grid-gutter-widths, lg) / 2;
    margin-right: -map-get($grid-gutter-widths, lg) / 2;
    @media #{$media-xs} {
      margin-right: -map-get($grid-gutter-widths, xs) / 2;
      margin-left: -map-get($grid-gutter-widths, xs) / 2;
    }
  }
  .col-md-12 {
    padding-left: map-get($grid-gutter-widths, lg) / 2;
    padding-right: map-get($grid-gutter-widths, lg) / 2;
    @media #{$media-xs} {
      padding-left: map-get($grid-gutter-widths, xs) / 2;
      padding-right: map-get($grid-gutter-widths, xs) / 2;
    }
  }
  .product-listing {
    padding-top: 30px;
    overflow-y: scroll;
    height: 510px;
  }
  .product {
    box-sizing: border-box;
    width: 33.33%;
    padding-left: map-get($grid-gutter-widths, lg) / 2;
    padding-right: map-get($grid-gutter-widths, lg) / 2;
    @media #{$media-xs} {
      width: 50%;
      padding-left: map-get($grid-gutter-widths, xs) / 2;
      padding-right: map-get($grid-gutter-widths, xs) / 2;
    }
  }
  .close-icon {
    padding: 18px 8px;
  }
  .search-input-group {
    display: flex;
    border-bottom: 1px solid #bdbdbd;
  }
  .search-icon {
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .search-panel-input {
    width: 100%;
    height: 60px;
    padding-bottom: 0;
    padding-top: 0;
    border: none;
    outline: 0;
    font-size: 18px;
    font-family: map-get($font-families, secondary);
    @media #{$media-xs} {
      font-size: 16px;
    }
  }
  .no-results {
    top: 5px;
    width: 100%;
  }
  i {
    // opacity: 0.6;
  }
  i:hover {
    opacity: 1;
  }
  .close-button {
    background: #fff;
  }
  button {
    @media #{$media-xs} {
      width: 100%;
      margin-bottom: 15px;
    }
  }
}
.search-action-btn {
  position: absolute;
  right: 0px;
  top: 3px;
  width: auto;
  height: 100%;
}
.new-searchformTag {
  width: 100%;
}
.buttons-set {
  margin-top: 15px;
}
@media (max-width: 767px) {
  .searchbar-show {
    width: 100%;
    background-color: #fff;
    margin: 0px;
  }
  #active-icon {
    visibility: visible;
  }
  .custom-search-icon {
    display: block;
    position: absolute !important;
    top: 85px;
    left: 93%;
    height: 45px;
    width: 45px;
    background-color: #ffffff;
    border: 2px solid #e3e3e5;
    img {
      height: 27px;
      position: absolute;
      left: 8px;
      top: 10px;
    }
  }
  .search-bar {
    .searchpanel {
      // background-color: #fff;
      // height: 62px;
      // margin-right: 0px;
      // visibility: hidden;

      .container {
        width: 100%;
        display: block;
        padding-left: 15px;
        padding-right: 15px;
        .search-input-group {
          margin: 0px;
          width: 100%;
          input {
            border-radius: 0;
            border: 2px solid #e3e3e5;
            max-width: 100%;
            height: 45px;
            background-color: #f7f6f6;
            color: #434343;
            font-family: sans-serif;
            font-weight: bold;
            line-height: 0px !important;
            margin: 0px;
            padding: 0px;
            padding-left: 4rem;
          }
          .search-icon {
            top: 0;
            color: #d6de29;
            &::after {
              top: 10px;
            }
          }
        }
        .sb-filters {
          top: 52px;
          right: 0;
          left: 5%;
          max-width: 86%;
          overflow-y: auto;
          overflow-x: hidden;
          height: 64vh;
          /* background-color: #D6DE29; */
          border: 2px solid #d6de29;
        }
      }
    }
  }
  .new-searchformTag {
    display: flex;
  }
  .search-action-btn {
    top: 0;
    right: 40px;
  }
}
// @media (min-width: 992px) and (max-width: 1199px) {
//   .search-action-btn{
//     right: 35px;
//   }
// }
@media (min-width: 768px) and (max-width: 991px) {
  .search-action-btn {
    // right: -38px;
  }
  .searchpanel .container .search-input-group input {
    margin-left: -33px;
    // padding-left: 4rem;
  }
}
@media (min-width: 767px) and (max-width: 1200px) {
  .searchpanel .product {
    width: 50%;
  }
  .searchpanel .container {
    padding-left: 12px;
    padding-right: 0px;
  }
}
@media (max-width: 423px) {
  .custom-search-icon a {
    bottom: 11px;
    right: 162px;
  }
  .custom-search-icon i {
    font-size: 30px;
  }
}
@media (min-width: 768px) {
  .search-bar .searchpanel .container {
    display: block !important;
  }
  .custom-search-icon a {
    bottom: 4px;
    right: 145px;
  }
}
.container.show {
  display: block !important;
}
@media (min-width: 320px) and (max-width: 423px) {
  .search-bar .searchpanel .container .sb-filters {
    top: 52px;
    right: 0;
    left: 5%;
    max-width: 84%;
    overflow-y: auto;
    overflow-x: hidden;
    height: 64vh;
  }
}
</style>
