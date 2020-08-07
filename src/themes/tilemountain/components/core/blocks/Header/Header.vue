<template>
  <div class="header">
    <header
      class="fixed w-100 bg-cl-primary brdr-cl-secondary"
      :class="{ 'is-visible': navVisible }"
    >
      <div class="container px15">
        <div class="row between-xs middle-xs" v-if="!isCheckoutPage || isThankYouPage">
          <!-- <div class="col-md-4 col-xs-2 middle-xs">
            <div>
              <hamburger-icon class="p15 icon bg-cl-secondary pointer" />
            </div>
          </div>-->
          <!-- <div class="col-xs-2 visible-xs">
            <search-icon class="p15 icon pointer" />
          </div>-->
          <div class="col-lg-2 col-md-2 col-xs-4 pt5">
            <div>
              <logo height="78px" width="150px" />
            </div>
          </div>
          <div class="search-bar col-lg-5 col-md-6 col-xs-12 middle-xs">
            <div>
              <DesktopSearch />
            </div>
          </div>
          <!-- <div class="col-xs-2 visible-xs">
            <wishlist-icon class="p15 icon pointer" />
          </div>-->
          <div class="col-lg-5 col-md-4 col-xs-8 end-xs flex">
            <!-- <search-icon class="icon pointer" /> -->
            <Telephone class="icon hidden-xs col-md-4 col-lg-9 pointer p-icon" />
            <wishlist-icon class="icon hidden-xs pointer col-md-3 col-lg-1 w-icon" />
            <!-- <compare-icon class="p15 icon hidden-xs pointer" /> -->
            <account-icon class="icon pointer col-md-3 col-lg-1 a-icon" />
            <microcart-icon class="icon pointer col-md-3 col-lg-1 m-icon" />
          </div>
        </div>
        <div class="row between-xs middle-xs px15 py5" v-if="isCheckoutPage && !isThankYouPage">
          <!-- <div class="col-xs-5 col-md-3 middle-xs">
            <div>
              <router-link
                :to="localizedRoute('/')"
                class="cl-tertiary links"
              >{{ $t('Return to shopping') }}</router-link>
            </div>
          </div>-->
          <div class="col-xs-2 col-md-12 center-xs">
            <logo width="auto" height="75px" />
          </div>
          <!-- <div class="col-xs-5 col-md-3 end-xs">
            <div>
              <a
                v-if="!currentUser"
                href="#"
                @click.prevent="gotoAccount"
                class="cl-tertiary links"
              >{{ $t('Login to your account') }}</a>
              <span v-else>{{ $t('You are logged in as {firstname}', currentUser) }}</span>
            </div>
          </div>-->
        </div>
      </div>
      <nav>
        <MainMenu />
      </nav>
      <!-- <nav> -->
      <!-- <DesktopMenu class="hidden-xs" /> -->
      <!-- <div class="desktop-menu hidden-xs" v-if="!isCheckoutPage && !isThankYouPage">
          <Navmenu />
        </div>
        <div class="mobile-menu" v-if="!isCheckoutPage && !isThankYouPage">
          <hamburger-icon class="sb-mobile-menu pointer" />
        </div>
      </nav>-->
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
    WishlistIcon,
    DesktopSearch,
    Telephone,
    MainMenu,
  },
  mixins: [CurrentPage],
  data() {
    return {
      navVisible: true,
      isScrolling: false,
      scrollTop: 0,
      lastScrollTop: 0,
      navbarHeight: 54,
    };
  },
  computed: {
    ...mapState({
      isOpenLogin: (state) => state.ui.signUp,
      currentUser: (state) => state.user.current,
    }),
    isThankYouPage() {
      return this.$store.state.checkout.isThankYouPage
        ? this.$store.state.checkout.isThankYouPage
        : false;
    },
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
    },
  },
};
</script>

<style lang="scss" scoped>
@import "~theme/css/variables/colors";
@import "~theme/css/helpers/functions/color";
$color-icon-hover: color(secondary, $colors-background);
.header {
  height: 9.25rem;
}
.only-mobile {
  display: none;
}
header {
  height: auto;
  z-index: 3;
  transition: top 0.2s ease-in-out;
  background-color: #fff;
  // &.is-visible {
  //   top: 35px;
  // }
}

.icon {
  opacity: 1;
  &:hover,
  &:focus {
    // background-color: $color-icon-hover;\
    opacity: 1;
  }
}
.right-icons {
  //for edge
  float: right;
}
.desktop-menu {
  width: 100%;
  height: 47px;
  background-color: #f2f2f2;
  border-top: 2px solid #fff;
}
.header-placeholder {
  height: 54px;
}
.links {
  text-decoration: underline;
}
.sb-mobile-menu {
  display: none;
}
.p-icon {
  width: 70%;
}
.w-icon {
  width: 10%;
}
.a-icon {
  width: 10%;
}
.m-icon {
  width: 10%;
}
@media (max-width: 992px) {
  .desktop-menu {
    display: none;
  }
  .mobile-menu {
    display: block;
    background-color: #f2f2f2;
  }
  .sb-mobile-menu {
    display: block;
  }
}
// @media (min-width: 992px) and (max-width: 1199px) {
//   .header {
//     height: 10.5rem;
//   }
// }
// @media (min-width: 767px) and (max-width: 991px) {
//   .header {
//     height: 10.6rem;
//   }
// }
@media (max-width: 767px) {
  .px15 {
    padding-left: 0px;
    padding-right: 0px;
  }
  .row.middle-xs {
    margin: 0 -15px;

    & y5 {
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
  .only-mobile {
    display: block;
  }
  .sb-mobile-menu {
    display: none;
  }
  nav {
    display: none;
  }
  .header {
    height: 5.54rem;
    @media (max-width: 423px) {
      height: 7.6rem;
    }
  }
}
</style>
