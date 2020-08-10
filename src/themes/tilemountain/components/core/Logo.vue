<template>
  <router-link
    :to="localizedRoute('/')"
    :title="$t('Home Page')"
    class="no-underline inline-flex"
  >
    <img
      :width="width"
      :height="height"
      src="/assets/logo.svg"
      :alt="$t(defaultTitle)"
    />
  </router-link>
</template>

<script>
import config from "config";
import { currentStoreView } from "@vue-storefront/core/lib/multistore";

export default {
  data() {
    const storeView = currentStoreView();
    return {
      defaultTitle: storeView.seo.defaultTitle
        ? storeView.seo.defaultTitle
        : config.seo.defaultTitle
    };
  },
  props: {
    width: {
      type: [String, Number],
      required: true
    },
    height: {
      type: [String, Number],
      required: true
    }
  }
};
</script>
<style lang="scss" scoped>
@media (max-width: 992px) {
  img {
    width: 125px;
  }
}
@media (max-width: 767px) {
  img {
    width: 130px;
    height: 76px;
  }
  a {
    margin-left: 31px;
  }
}

@media (max-width: 399px) {
  img {
    width: 65px;
    height: 50px;
  }
  a {
    margin-left: 75px;
  }
}
</style>
