/**
 * DEVELOPER DOCUMENTATION
 *
 * Include your custom JavaScript here.
 *
 * The theme Focal has been developed to be easily extensible through the usage of a lot of different JavaScript
 * events, as well as the usage of custom elements (https://developers.google.com/web/fundamentals/web-components/customelements)
 * to easily extend the theme and re-use the theme infrastructure for your own code.
 *
 * The technical documentation is summarized here.
 *
 * ------------------------------------------------------------------------------------------------------------
 * BEING NOTIFIED WHEN A VARIANT HAS CHANGED
 * ------------------------------------------------------------------------------------------------------------
 *
 * This event is fired whenever a the user has changed the variant in a selector. The target get you the form
 * that triggered this event.
 *
 * Example:
 *
 * document.addEventListener('variant:changed', function(event) {
 *   let variant = event.detail.variant; // Gives you access to the whole variant details
 *   let form = event.target;
 * });
 *
 * ------------------------------------------------------------------------------------------------------------
 * MANUALLY CHANGE A VARIANT
 * ------------------------------------------------------------------------------------------------------------
 *
 * You may want to manually change the variant, and let the theme automatically adjust all the selectors. To do
 * that, you can get the DOM element of type "<product-variants>", and call the selectVariant method on it with
 * the variant ID.
 *
 * Example:
 *
 * const productVariantElement = document.querySelector('product-variants');
 * productVariantElement.selectVariant(12345);
 *
 * ------------------------------------------------------------------------------------------------------------
 * BEING NOTIFIED WHEN A NEW VARIANT IS ADDED TO THE CART
 * ------------------------------------------------------------------------------------------------------------
 *
 * This event is fired whenever a variant is added to the cart through a form selector (product page, quick
 * view...). This event DOES NOT include any change done through the cart on an existing variant. For that,
 * please refer to the "cart:updated" event.
 *
 * Example:
 *
 * document.addEventListener('variant:added', function(event) {
 *   var variant = event.detail.variant; // Get the variant that was added
 * });
 *
 * ------------------------------------------------------------------------------------------------------------
 * BEING NOTIFIED WHEN THE CART CONTENT HAS CHANGED
 * ------------------------------------------------------------------------------------------------------------
 *
 * This event is fired whenever the cart content has changed (if the quantity of a variant has changed, if a variant
 * has been removed, if the note has changed...). This event will also be emitted when a new variant has been
 * added (so you will receive both "variant:added" and "cart:updated"). Contrary to the variant:added event,
 * this event will give you the complete details of the cart.
 *
 * Example:
 *
 * document.addEventListener('cart:updated', function(event) {
 *   var cart = event.detail.cart; // Get the updated content of the cart
 * });
 *
 * ------------------------------------------------------------------------------------------------------------
 * REFRESH THE CART/MINI-CART
 * ------------------------------------------------------------------------------------------------------------
 *
 * If you are adding variants to the cart and would like to instruct the theme to re-render the cart, you cart
 * send the cart:refresh event, as shown below:
 *
 * document.documentElement.dispatchEvent(new CustomEvent('cart:refresh', {
 *   bubbles: true
 * }));
 *
 * ------------------------------------------------------------------------------------------------------------
 * USAGE OF CUSTOM ELEMENTS
 * ------------------------------------------------------------------------------------------------------------
 *
 * Our theme makes extensive use of HTML custom elements. Custom elements are an awesome way to extend HTML
 * by creating new elements that carry their own JavaScript for adding new behavior. The theme uses a large
 * number of custom elements, but the two most useful are drawer and popover. Each of those components add
 * a "open" attribute that you can toggle on and off. For instance, let's say you would like to open the cart
 * drawer, whose id is "mini-cart", you simply need to retrieve it and set its "open" attribute to true (or
 * false to close it):
 *
 * document.getElementById('mini-cart').open = true;
 *
 * Thanks to the power of custom elements, the theme will take care automagically of trapping focus, maintaining
 * proper accessibility attributes...
 *
 * If you would like to create your own drawer, you can re-use the <drawer-content> content. Here is a simple
 * example:
 *
 * // Make sure you add "aria-controls", "aria-expanded" and "is" HTML attributes to your button:
 * <button type="button" is="toggle-button" aria-controls="id-of-drawer" aria-expanded="false">Open drawer</button>
 *
 * <drawer-content id="id-of-drawer">
 *   Your content
 * </drawer-content>
 *
 * The nice thing with custom elements is that you do not actually need to instantiate JavaScript yourself: this
 * is done automatically as soon as the element is inserted to the DOM.
 *
 * ------------------------------------------------------------------------------------------------------------
 * THEME DEPENDENCIES
 * ------------------------------------------------------------------------------------------------------------
 *
 * While the theme tries to keep outside dependencies as small as possible, the theme still uses third-party code
 * to power some of its features. Here is the list of all dependencies:
 *
 * "vendor.js":
 *
 * The vendor.js contains required dependencies. This file is loaded in parallel of the theme file.
 *
 * - custom-elements polyfill (used for built-in elements on Safari - v1.0.0): https://github.com/ungap/custom-elements
 * - web-animations-polyfill (used for polyfilling WebAnimations on Safari 12, this polyfill will be removed in 1 year - v2.3.2): https://github.com/web-animations/web-animations-js
 * - instant-page (v5.1.0): https://github.com/instantpage/instant.page
 * - tocca (v2.0.9); https://github.com/GianlucaGuarini/Tocca.js/
 * - seamless-scroll-polyfill (v2.0.0): https://github.com/magic-akari/seamless-scroll-polyfill
 *
 * "flickity.js": v2.2.0 (with the "fade" package). Flickity is only loaded on demand if there is a product image
 * carousel on the page. Otherwise it is not loaded.
 *
 * "photoswipe": v4.1.3. PhotoSwipe is only loaded on demand to power the zoom feature on product page. If the zoom
 * feature is disabled, then this script is never loaded.
 */

document.addEventListener("DOMContentLoaded", function () {
  const element = document.querySelector(".article__content");
  const text = element.innerHTML;
  const regex = /\[product="(.*?)"/g;
  const productSkus = [];
  let modifiedText = text;

  const replaceProduct = function (sku) {
    const storefront = window.ShopifyBuy.buildClient({
      domain: "assessment-center-115.myshopify.com",
      storefrontAccessToken: "39aabe9f2d5fa6f33ee1a0029eab4f4e",
    });
    productSkus.push(sku);

    return new Promise(function (resolve, reject) {
      return storefront.product
        .fetchQuery({ query: '"' + sku + '"' })
        .then((products) => {
          if (products && products.length > 0) {
            const product = products[0];
            const productTemplate = getProductTemplateFromProduct(product);
            resolve({ sku: sku, template: productTemplate });
          } else {
            reject(sku);
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          reject(sku);
        });
    });
  };

  const promises = [];
  let match;
  while ((match = regex.exec(text))) {
    const sku = match[1];
    promises.push(replaceProduct(sku));
  }

  Promise.all(promises)
    .then(function (results) {
      results.forEach(function (result) {
        const regex = new RegExp('\\[product="' + result.sku + '"]', "g");
        modifiedText = modifiedText.replace(regex, result.template);
      });
      element.innerHTML = modifiedText;
    })
    .catch(function (failedSku) {
      console.log("Failed to fetch product with SKU: " + failedSku);
    });
});

function getProductTemplateFromProduct(product) {
  const productId = product.id.split("/").pop();
  const variantId = product.variants[0].id.split("/").pop();
  const priceAmount = product.variants[0].price.amount;
  const compareAtPrice = product.variants[0].compareAtPrice.amount;
  const currencyCode = product.variants[0].price.currencyCode;
  const formattedPrice = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(priceAmount);

  
  return `<div class="product-item custom_blog_product" style="opacity: 1">
  <div class="product-item__image-wrapper">
    <div class="product-item__label-list label-list">
      <span class="label label--highlight">Save ${compareAtPrice - priceAmount} ${product.variants[0].price.currencyCode}</span>
    </div>
    <a
      href="/products/${product.handle}"
      data-instant=""
      class="product-item__aspect-ratio aspect-ratio"
      style="
        padding-bottom: 100%;
        --aspect-ratio: 1;
      "
      ><img
        src="${product.images[0].src}"
        alt="${product.images[0].altText}"
        width="${product.images[0].width}"
        height="${product.images[0].height}"
        loading="lazy"
        sizes="(max-width: 740px) calc(50vw - 24px), calc((min(100vw - 80px, 1520px) - 305px) / 4 - 18px)"
        class="product-item__primary-image"
      />
    </a>
    <form
      method="post"
      action="/cart/add"
      id="product_form_template--16713331998911__main__${product.id}_0"
      accept-charset="UTF-8"
      class="product-item__quick-form"
      enctype="multipart/form-data"
      is="product-form"
    >
      <input type="hidden" name="form_type" value="product" /><input
        type="hidden"
        name="utf8"
        value="✓"
      /><input type="hidden" name="quantity" value="1" />
      <input type="hidden" name="id" value="${variantId}" />
      <button
        is="loader-button"
        type="submit"
        class="button button--outline button--text button--full hidden-touch"
      >
        <span class="loader-button__text">+ Add to cart</span>
        <span class="loader-button__loader" hidden="">
          <div class="spinner">
            <svg
              focusable="false"
              width="24"
              height="24"
              class="icon icon--spinner"
              viewBox="25 25 50 50"
            >
              <circle
                cx="50"
                cy="50"
                r="20"
                fill="none"
                stroke="currentColor"
                stroke-width="5"
              ></circle>
            </svg>
          </div>
        </span>
      </button>
      <button
        type="submit"
        class="product-item__quick-buy-button hidden-no-touch"
      >
        <span class="visually-hidden">+ Add to cart</span
        ><svg
          focusable="false"
          width="24"
          height="24"
          class="icon icon--quick-buy-shopping-bag"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M14 4H5L4 20H20C19.7517 16.0273 19.375 10 19.375 10"
            stroke="currentColor"
            stroke-width="2"
          ></path>
          <path
            d="M9 7V7C9 8.65685 10.3431 10 12 10V10C13.6569 10 15 8.65685 15 7V7"
            stroke="currentColor"
            stroke-width="2"
          ></path>
          <path
            d="M20 0V8M16 4H24"
            stroke="currentColor"
            stroke-width="2"
          ></path>
        </svg></button
      ><input type="hidden" name="product-id" value="${productId}" /><input
        type="hidden"
        name="section-id"
        value="template--16713331998911__main"
      />
    </form>
  </div>

  <div class="product-item__info">
    <div class="product-item-meta">
      <a
        href="/products/${product.handle}"
        data-instant=""
        class="product-item-meta__title"
        >${product.title}</a
      >

      <div class="product-item-meta__price-list-container">
        <div class="price-list price-list--centered">
          <span class="price price--highlight">
            <span class="visually-hidden">Sale price</span>${product.variants[0].price.amount} ${product.variants[0].price.currencyCode}</span
          >

          <span class="price price--compare">
            <span class="visually-hidden">Regular price</span>${compareAtPrice} ${product.variants[0].price.currencyCode}</span
          >
        </div>
      </div>
    </div>
  </div>
</div>
          `;
}
