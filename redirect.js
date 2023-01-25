var isLoadingSecureCheckout = false;

function showSecureLoader() {
    isLoadingSecureCheckout = true;
    document.getElementById('checkout-secure-loader').style.display = "block";
}

function hideSecureLoader() {
    isLoadingSecureCheckout = false;
    document.getElementById('checkout-secure-loader').style.display = "none";
}

function ckGetAjax(url) {
    return new Promise((resolve, reject) => {
        var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
        xhr.open('GET', url);
        xhr.onreadystatechange = function () {
            if (xhr.readyState > 3 && xhr.status == 200) resolve(xhr.responseText);
        };
        xhr.send();
    })
}

function ckPostAjax(url, data) {
    console.log("ckPostAjax()");
    
    return new Promise((resolve, reject) => {
        var xhr;


        if (window.XMLHttpRequest) {
            console.log("new XMLHttpRequest()")
            xhr = new XMLHttpRequest();
        } else {
            console.log(`new ActiveXObject("Microsoft.XMLHTTP")`);
            console.log("here we are...");
            xhr = new ActiveXObject("Microsoft.XMLHTTP");
        }

        xhr.open('POST', url);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onreadystatechange = function () {
            if (xhr.readyState > 3 && xhr.status == 200) {
                resolve(xhr.responseText);
            } else if (xhr.status != 200) {
                hideSecureLoader();
            }
        };
        xhr.send(data);
        return xhr;
    })
}

async function navigateToCheckout() {
    var cart = await getCart();
    var checkout = await createCheckout(cart);
    await clearCart();

    var search = window.location.search;

    var checkoutUrl = checkout.checkoutUrl;

    if (checkoutUrl.includes("?") && !!search) {
        search = search.replace("?", "&")
    }

    window.location.href = checkout.checkoutUrl + search;
}

async function addToCart(formSerialize) {
    console.log("formSerialize: ", formSerialize)

    var response = await ckPostAjax("/cart/add.js", formSerialize);

    console.log("addCart response: ", response)

    var payload;
    try {
        payload = JSON.parse(response);
    } catch (e) {
        hideSecureLoader();
    }
    return payload;
}

async function getCart() {
    var response = await ckGetAjax('/cart.json');
    var cartPayload = JSON.parse(response);
    return cartPayload;
}

async function clearCart() {
    await ckPostAjax("/cart/clear.js");
}

async function createCheckout(cart) {
    return new Promise((resolve, reject) => {
        fetch(`https://shopifyredirect-production.up.railway.app/`, {
            body: JSON.stringify(cart),
            method: "post",
            headers: {
                'Content-type': 'application/json'
            }
        })
            .then((response) => {
                resolve(response.json());
            })
            .catch((error) => {
                console.error('error: ', error);
                reject();
            });
    })
}

if (shopTemplateName === "cart") {
    var submitBtns = document.querySelectorAll("[name=checkout]");
    submitBtns.forEach(submitBtn => {
        submitBtn.type = "button";
        submitBtn.style.userSelect = "none"
        submitBtn.addEventListener("click", async function () {
            if (isLoadingSecureCheckout) return;
            showSecureLoader();
            navigateToCheckout();
        })
    })
}

if ((shopTemplateName === "product" || shopTemplateName === "index") && checkoutSkipCart) {

    var sellButtons = [
        `button.button--addToCart`,
        `button.ProductForm__AddToCart`,
        `button.product-form__add-button`,
        `button#add-to-cart`,
        `button.add-to-cart-btn`,
        `button.add-to-cart`,
        `button.button-buy`,
        `button#buttonBuy`,
        `button#AddToCartText`,
        `button#AddToCart`,
        `input[name="add"]`,
        `button[name=\'add\']`,
        `button.single_add_to_cart_button`
    ];

    var buttonsString = sellButtons.join(", ");

    var addCartBtns = document.querySelectorAll(buttonsString);
    if (addCartBtns && addCartBtns.length > 0) {
        addCartBtns.forEach(btn => {
            btn.addEventListener("click", async function (event) {
                event.preventDefault();
                if (isLoadingSecureCheckout) return;
                showSecureLoader();

                var form_count = $('form[action="/cart/add"]').length;
                if (typeof form_count != 'undefined' && form_count <= 1) {
                    var form = $('form[action="/cart/add"]');
                    console.log("form 1...")
                } else {
                    var form = $(this).parents('form[action="/cart/add"]');
                    console.log("form 2...")
                }

                await addToCart($(form).serialize());

                await navigateToCheckout();
            })
        })
    }
}