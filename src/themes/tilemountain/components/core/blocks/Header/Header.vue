<template>
  <div class="header">
    <header
      class="fixed w-100 bg-cl-primary brdr-cl-secondary"
      :class="{ 'is-visible': navVisible }"
    >
      <div class="container px15">
        <div
          class="row between-xs middle-xs"
          v-if="!isCheckoutPage || isThankYouPage"
        >
          <div class="col-md-2 col-xs-7 pt5">
            <div>
              <logo width="161px" height="78px" />
            </div>
          </div>
          <div class="search-bar col-md-5 col-xs-12 middle-xs">
            <div>
              <DesktopSearch />
            </div>
          </div>
          <!-- <div class="col-xs-2 visible-xs">
            <search-icon class="p15 icon pointer" />
          </div>-->
          <div class="col-xs-1 visible-xs">
            <Telephone class="pointer" />
          </div>
          <div class="col-xs-1 visible-xs">
            <wishlist-icon class="pointer" />
          </div>
          <div class="col-xs-1 visible-xs">
            <account-icon class="pointer" />
          </div>
          <div class="col-md-5 col-xs-2 pr-8">
            <div class="inline-flex">
              <!-- <search-icon class="p15 icon hidden-xs pointer" /> -->
              <Telephone class="p15 icon hidden-xs pointer" />
              <div class="flex inner-icons">
                <wishlist-icon class="icon hidden-xs pointer" />
                <compare-icon class="icon hidden-xs pointer" />
                <account-icon class="icon hidden-xs pointer" />
                <microcart-icon class="pointer" />
              </div>
            </div>
          </div>
        </div>
        <div
          class="row between-xs middle-xs px15 py5"
          v-if="isCheckoutPage && !isThankYouPage"
        >
          <div class="col-xs-5 col-md-3 middle-xs">
            <div>
              <router-link :to="localizedRoute('/')" class="cl-tertiary links">
                {{ $t("Return to shopping") }}
              </router-link>
            </div>
          </div>
          <div class="col-xs-2 col-md-6 center-xs">
            <logo width="auto" height="41px" />
          </div>
          <div class="col-xs-5 col-md-3 end-xs">
            <div>
              <a
                v-if="!currentUser"
                href="#"
                @click.prevent="gotoAccount"
                class="cl-tertiary links"
                >{{ $t("Login to your account") }}</a
              >
              <span v-else>
                {{ $t("You are logged in as {firstname}", currentUser) }}
              </span>
            </div>
          </div>
        </div>
      </div>
      <nav>
        <MainMenu class="hidden-xs" />
        <hamburger-icon class="sb-mobile-menu pointer hidden-md" />
      </nav>
    </header>

    <div class="header-placeholder" />
  </div>
</template>

<script>
import { mapState } from "vuex";
import CurrentPage from "theme/mixins/currentPage";
import AccountIcon from "theme/components/core/blocks/Header/AccountIcon";
import CompareIcon from "theme/components/core/blocks/Header/CompareIcon";
import HamburgerIcon from "theme/components/core/blocks/Header/HamburgerIcon";
import Logo from "theme/components/core/Logo";
import MicrocartIcon from "theme/components/core/blocks/Header/MicrocartIcon";
import SearchIcon from "theme/components/core/blocks/Header/SearchIcon";
import WishlistIcon from "theme/components/core/blocks/Header/WishlistIcon";
import DesktopSearch from "theme/components/core/blocks/Header/DesktopSearch";
import Telephone from "theme/components/core/blocks/Header/Telephone";
import MainMenu from "theme/components/core/blocks/Header/MainMenu";
export default {
  name: "Header",
  components: {
    AccountIcon,
    CompareIcon,
    HamburgerIcon,
    Logo,
    MicrocartIcon,
    SearchIcon,
    DesktopSearch,
    Telephone,
    MainMenu,
    WishlistIcon
  },
  mixins: [CurrentPage],
  data() {
    return {
      navVisible: true,
      isScrolling: false,
      scrollTop: 0,
      lastScrollTop: 0,
      navbarHeight: 54
    };
  },
  computed: {
    ...mapState({
      isOpenLogin: state => state.ui.signUp,
      currentUser: state => state.user.current
    }),
    isThankYouPage() {
      return this.$store.state.checkout.isThankYouPage
        ? this.$store.state.checkout.isThankYouPage
        : false;
    }
  },
  beforeMount() {
    window.addEventListener(
      "scroll",
      () => {
        this.isScrolling = true;
      },
      { passive: true }
    );
    setInterval(() => {
      if (this.isScrolling) {
        this.hasScrolled();
        this.isScrolling = false;
      }
    }, 250);
  },
  methods: {
    gotoAccount() {
      this.$bus.$emit("modal-toggle", "modal-signup");
    },
    hasScrolled() {
      this.scrollTop = window.scrollY;
      if (
        this.scrollTop > this.lastScrollTop &&
        this.scrollTop > this.navbarHeight
      ) {
        this.navVisible = false;
      } else {
        this.navVisible = true;
      }
      this.lastScrollTop = this.scrollTop;
    }
  }
};
</script>

<style lang="scss" scoped>
@import "~theme/css/variables/colors";
@import "~theme/css/helpers/functions/color";
// $color-icon-hover: color(secondary, $colors-background);
.header {
  height: 9.825rem;
}
.inner-icons {
  padding-left: 124px;
  @media (max-width: 1200px) {
    padding: 0px;
  }
}
header {
  // height: 95px;
  // top: -55px;
  z-index: 3;
  transition: top 0.2s ease-in-out;
  &.is-visible {
  }
  .wishlist {
    padding: 10px;
    .wishlist-img {
      span {
        display: block;
        text-align: center;
      }
    }
    .wishlist-text {
      span {
        font-size: 0.671875rem;
        font-family: "Open Sans";
        color: #808898;
      }
    }
  }
  .sb-header-right {
    padding: 0;
    button {
      opacity: 1;
    }
  }
}
// .icon {
//   opacity: 0.6;
//   &:hover,
//   &:focus {
//     background-color: $color-icon-hover;
//     opacity: 1;
//   }
// }
.right-icons {
  //for edge
  float: right;
}
.header-placeholder {
  height: 54px;
}
.links {
  text-decoration: underline;
}
@media (max-width: 767px) {
  .row.middle-xs {
    margin: 0 -15px;
    &.py5 {
      margin: 0;
    }
  }
  .col-xs-2:first-of-type {
    padding-left: 0;
  }
  .col-xs-2:last-of-type {
    padding-right: 0;
  }
  a,
  span {
    font-size: 12px;
  }
  .search-bar {
    order: 2;
    padding-left: 3px;
    padding-right: 3px;
  }
  .sb-mobile-menu {
    display: block;
    position: absolute !important;
    top: 85px;
    left: 0px;
    height: 49px;
    width: 53px;
    background-color: #ffffff;
    border: 2px solid #e3e3e5;
  }
  header {
    height: 7.625rem;
  }
  .container {
    padding-right: 0px;
    padding-left: 0px;
  }
}
</style>
