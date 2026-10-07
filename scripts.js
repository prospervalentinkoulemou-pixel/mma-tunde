const SUPABASE_URL = "https://rvvuozouvswnmnthldpt.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_foNeeSBsHmI1D_XlXJevZA_dirTlK5j";

let products = [];
let cats = ["Tous"];
let current = "Tous";
let cart = [];

const money = n =>
  Number(n || 0).toLocaleString("fr-FR") + " GNF";

async function loadProductsFromSupabase() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/Plats?select=*&Disponible=eq.true&order=id.asc`,
      {
        headers: {
  apikey: SUPABASE_ANON_KEY
}
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Supabase ${response.status}: ${errorText}`
      );
    }

    const data = await response.json();

    products = data.map(p => ({
      id: p.id,
      name: p.nom || "Plat",
      description: p.Description || "",
      cat: p["Catégorie"] || "Autres",
      price: Number(p.Prix) || 0,
      img: p.image_url || ""
    }));

    cats = [
      "Tous",
      ...new Set(products.map(p => p.cat).filter(Boolean))
    ];

    renderFilters();
    render();

    console.log(
      "Plats chargés depuis Supabase :",
      products.length
    );

  } catch (error) {
    console.error("Erreur Supabase :", error);

    document.getElementById("filters").innerHTML = "";

    document.getElementById("menuGrid").innerHTML =
      "<p>Impossible de charger le menu pour le moment.</p>";
  }
}

function renderFilters() {
  const filters = document.getElementById("filters");

  filters.innerHTML = cats.map(c => `
    <button
      class="filter ${c === current ? "active" : ""}"
      onclick='setCat(${JSON.stringify(c)})'>
      ${c}
    </button>
  `).join("");
}

function setCat(c) {
  current = c;
  renderFilters();
  render();
}

function render() {
  const grid = document.getElementById("menuGrid");

  const list =
    current === "Tous"
      ? products
      : products.filter(p => p.cat === current);

  if (!list.length) {
    grid.innerHTML =
      "<p>Aucun plat disponible dans cette catégorie.</p>";
    return;
  }

  grid.innerHTML = list.map(p => {

    const imageStyle = p.img
      ? `style="background-image:url('${p.img.replace(/'/g, "%27")}')"`
      : "";

    return `
      <article class="item">

        <div class="item-img" ${imageStyle}></div>

        <div class="item-body">

          <h3>${p.name}</h3>

          <p>${p.description || p.cat}</p>

          <div class="item-bottom">

            <span class="price">
              ${money(p.price)}
            </span>

            <button
              class="add"
              onclick='add(${JSON.stringify(p.name)})'>
              Ajouter
            </button>

          </div>

        </div>

      </article>
    `;

  }).join("");
}

function add(name) {

  const product = products.find(p => p.name === name);

  if (!product) return;

  const existing = cart.find(x => x.name === name);

  if (existing) {
    existing.qty++;
  } else {
    cart.push({
      name: product.name,
      price: product.price,
      qty: 1
    });
  }

  updateCart();
  toggleCart(true);
}

function change(index, delta) {

  if (!cart[index]) return;

  cart[index].qty += delta;

  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }

  updateCart();
}

function updateCart() {

  const count = cart.reduce(
    (sum, item) => sum + item.qty,
    0
  );

  document.getElementById("cartCount").textContent = count;

  const cartItems = document.getElementById("cartItems");

  if (!cart.length) {

    cartItems.innerHTML =
      "<p style='color:#777'>Votre panier est vide.</p>";

  } else {

    cartItems.innerHTML = cart.map((item, index) => `
      <div class="cart-row">

        <div>
          <b>${item.name}</b>
          <br>
          <small>${money(item.price)}</small>
        </div>

        <div class="qty">

          <button onclick="change(${index}, -1)">
            −
          </button>

          ${item.qty}

          <button onclick="change(${index}, 1)">
            +
          </button>

        </div>

      </div>
    `).join("");
  }

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  document.getElementById("cartTotal").textContent =
    money(total);
}

function toggleCart(force) {

  const cartBox = document.getElementById("cart");
  const overlay = document.getElementById("overlay");

  const open =
    force === true ||
    !cartBox.classList.contains("open");

  cartBox.classList.toggle("open", open);
  overlay.classList.toggle("open", open);
}

function orderWhatsApp() {

  if (!