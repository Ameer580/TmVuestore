<template>
  <div class="phone">
    <a href="tel:0127 0340034" class="contact">
      <img src="/assets/icons/phone.svg" alt="icon" />
      <p>01782 223822</p>
    </a>
  </div>
</template>

<script>
export default {
  components: {
    name: "Telephone",
  },
};
</script>

<style lang="scss" scoped>
.contact {
  display: flex;
  padding-top: 12px;

  img {
    margin-top: 15px;
    height: 24px;
  }
  p {
    margin-left: 7px;
    font-size: 17px;
    color: #29275b;
    font-weight: 600;
  }
}
a.underline:after,
a:not(.no-underline):hover:after {
  content: none;
}
@media (min-width: 767px) and (max-width: 991px) {
  .contact {
    padding-right: 50px;
    img {
      margin-top: 22px;
    }
  }
}
@media (min-width: 991px) and (max-width: 1199px) {
  .phone {
    padding-right: 12px;
    a {
      padding: 13px;
    }
    img {
      margin-top: 12px;
    }
  }
  .contact p {
    font-size: 14px;
  }
}
@media (max-width: 992px) {
  .phone p {
    display: none;
  }
}
@media (max-width: 767px) {
  .wishlist {
    .wishlist-text {
      span {
        display: none;
      }
    }
  }
}
</style>