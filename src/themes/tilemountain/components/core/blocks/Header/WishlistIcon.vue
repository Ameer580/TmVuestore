<template>
  <div class="bg-cl-transparent brdr-none p0">
    <button type="button" class="bg-cl-transparent brdr-none p0">
      <img src="/assets/icons/location.svg" />
      <!-- <span
      class="whishlist-count absolute flex center-xs middle-xs border-box py0 px2 h6 lh16 weight-700 cl-white bg-cl-silver"
      v-cloak
      v-show="getWishlistItemsCount"
      >{{ getWishlistItemsCount }}</span>-->
    </button>
  </div>
</template>

<script>
// import WishlistIcon from "@vue-storefront/core/compatibility/components/blocks/Header/WishlistIcon";

export default {
  // mixins: [WishlistIcon]
};
</script>

<style scoped>
button {
  padding-right: 13px;
}
.whishlist-count {
  top: 7px;
  left: 50%;
  min-width: 16px;
  min-height: 16px;
  border-radius: 10px;
}
@media (max-width: 767px) {
  button {
    display: none;
  }
}
@media (min-width: 767px) and (max-width: 992px) {
  button {
    padding-top: 5px;
  }
}
img {
  height: 25px;
  margin-top: 12px;
}
</style>
