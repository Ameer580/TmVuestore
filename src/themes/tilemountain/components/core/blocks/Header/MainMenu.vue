<template>
  <div class="main">
    <div class="container">
      <ul>
        <li>
          <a href="#">Bathroom</a>
        </li>
        <li>
          <a href="#">Kitchen</a>
        </li>
        <li>
          <a href="#">Floor</a>
        </li>
        <li>
          <a href="#">Wall</a>
        </li>
        <li>
          <a href="#">Mosaic</a>
        </li>
        <li>
          <a href="#">Metro</a>
        </li>
        <li>
          <a href="#">Outdoor</a>
        </li>
        <li>
          <a href="#">Vinyl</a>
        </li>
        <li>
          <a href="#">Adhesive</a>
        </li>
        <li>
          <a href="#">Accessories</a>
        </li>
        <!-- <div class="hidden-elements"> -->
        <li class="clearance">
          <a href="#">Clearance</a>
        </li>
        <li class="style">
          <a href="#">Style & Advice</a>
        </li>
        <!-- </div> -->
      </ul>
    </div>
  </div>
</template>

<script>
export default {};
</script>

<style scoped>
.main {
  background-color: #29275b;
}
ul {
  padding: 0;
  margin: 0;
  position: relative;
  display: flex;
  list-style-type: none;
}
ul li {
  flex: 1 1 auto;
}
ul li a {
  text-align: center;
  padding: 13px 0px;
  display: block;
  line-height: 1;
  margin: 10px 0 10px 0;
  font-size: 15px;
  font-family: "Arial";
  font-weight: bold;
  color: #ffffff;
  /* text-transform: uppercase; */
}
.clearance {
  background-color: #24adee;
}
a.underline:after,
a:not(.no-underline):hover:after {
  content: none;
}
@media (min-width: 992px) and (max-width: 1199px) {
  ul li a {
    font-size: 13px;
  }
}
@media (min-width: 767px) and (max-width: 991px) {
  .clearance {
    display: none;
  }
  .style {
    display: none;
  }
  ul li a {
    font-size: 13px;
  }
}
</style>
