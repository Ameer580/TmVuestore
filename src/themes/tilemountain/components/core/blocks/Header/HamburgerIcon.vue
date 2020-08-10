<template>
  <button
    type="button"
    class="bg-cl-transparent brdr-none inline-flex"
    @click="openSidebarMenu"
    :aria-label="$t('Open menu')"
    data-testid="menuButton"
  >
    <i class="material-icons">menu</i>
  </button>
</template>

<script>
import HamburgerIcon from "@vue-storefront/core/compatibility/components/blocks/Header/HamburgerIcon";

export default {
  mixins: [HamburgerIcon]
};
</script>
<style scoped>
button i {
  font-size: 40px;
  color: #292a5b;
  position: absolute;
  top: 2px;
  left: 4px;
}
</style>
