/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateRoutineBtn = document.getElementById("generateRoutine");

/* Store selected products in an array */
let selectedProducts = [];

/* Store the conversation history for the chat */
let conversationHistory = [
  {
    role: "system",
    content:
      // Instruct the AI to use web search and include links/citations in responses
      "You are a helpful skincare and beauty routine assistant. You have access to real-time web search. When answering, always include the most current information about L'Oréal products or routines, and provide any relevant links or citations you find. Only answer questions about the generated routine, skincare, haircare, makeup, fragrance, or related beauty topics. If a question is off-topic, politely say you can only answer beauty-related questions.",
  },
];

/* Load selected products from localStorage if available */
function loadSelectedProductsFromStorage() {
  const saved = localStorage.getItem("selectedProducts");
  if (saved) {
    try {
      selectedProducts = JSON.parse(saved);
    } catch {
      selectedProducts = [];
    }
  }
}

/* Save selected products to localStorage */
function saveSelectedProductsToStorage() {
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  // Use products-grid class for layout
  productsContainer.classList.add("products-grid");
  productsContainer.innerHTML = products
    .map(
      (product) => `
    <div 
      class="product-card${
        selectedProducts.some((p) => p.id === product.id) ? " selected" : ""
      }" 
      data-product-id="${product.id}"
      tabindex="0"
      aria-pressed="${selectedProducts.some((p) => p.id === product.id)}"
    >
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
        <button class="toggle-desc-btn" data-product-id="${
          product.id
        }" style="margin-top:8px;">
          Show More
        </button>
      </div>
    </div>
  `
    )
    .join("");

  // Add click event listeners to each product card
  const cards = productsContainer.querySelectorAll(".product-card");
  cards.forEach((card) => {
    card.addEventListener("click", (event) => {
      // Prevent card click when clicking the toggle button
      if (event.target.classList.contains("toggle-desc-btn")) return;
      const productId = card.getAttribute("data-product-id");
      const product = products.find((p) => p.id == productId);

      // Check if product is already selected
      const index = selectedProducts.findIndex((p) => p.id == productId);
      if (index === -1) {
        // Add product to selectedProducts
        selectedProducts.push(product);
      } else {
        // Remove product from selectedProducts
        selectedProducts.splice(index, 1);
      }
      saveSelectedProductsToStorage();
      displayProducts(products);
      updateSelectedProductsList();
    });

    // Optional: Keyboard accessibility (Enter/Space)
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        card.click();
      }
    });
  });

  // Add event listeners for description modal buttons
  const toggleBtns = productsContainer.querySelectorAll(".toggle-desc-btn");
  toggleBtns.forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation(); // Prevent card selection
      const productId = btn.getAttribute("data-product-id");
      const product = products.find((p) => p.id == productId);
      showProductModal(product);
    });
  });
}

/* Show a modal window with product details */
function showProductModal(product) {
  // Create modal overlay
  const modalOverlay = document.createElement("div");
  modalOverlay.className = "modal-overlay";
  modalOverlay.tabIndex = 0;

  // Modal content
  modalOverlay.innerHTML = `
    <div class="modal-content" role="dialog" aria-modal="true" aria-label="${product.name}">
      <button class="modal-close-btn" aria-label="Close">&times;</button>
      <div class="modal-product">
        <img src="${product.image}" alt="${product.name}">
        <div class="modal-product-info">
          <h2>${product.name}</h2>
          <p>${product.description}</p>
        </div>
      </div>
    </div>
  `;

  // Add modal to body
  document.body.appendChild(modalOverlay);

  // Focus for accessibility
  modalOverlay.focus();

  // Close modal on overlay click or close button
  modalOverlay.addEventListener("click", (e) => {
    if (
      e.target === modalOverlay ||
      e.target.classList.contains("modal-close-btn")
    ) {
      document.body.removeChild(modalOverlay);
    }
  });

  // Close modal on Escape key
  modalOverlay.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.body.removeChild(modalOverlay);
    }
  });
}

/* Update the Selected Products section */
function updateSelectedProductsList() {
  // Find the selected-products container
  const selectedProductsContainer =
    document.querySelector(".selected-products");

  // Remove any previous flex header
  let flexHeader = document.getElementById("selectedProductsHeaderFlex");
  if (flexHeader) flexHeader.remove();

  // Create a flex container for the header and Clear All button
  flexHeader = document.createElement("div");
  flexHeader.id = "selectedProductsHeaderFlex";
  flexHeader.style.display = "flex";
  flexHeader.style.justifyContent = "space-between";
  flexHeader.style.alignItems = "center";
  flexHeader.style.marginBottom = "20px";

  // Create the header text
  const header = document.createElement("h2");
  header.textContent = "Selected Products";
  header.style.margin = "0";

  // Create or update the Clear All button
  let clearBtn = document.getElementById("clearAllBtn");
  if (!clearBtn) {
    clearBtn = document.createElement("button");
    clearBtn.id = "clearAllBtn";
    clearBtn.textContent = "Clear All";
    clearBtn.style =
      "background:#eee; border:1px solid #bbb; border-radius:4px; padding:6px 16px; font-size:15px; cursor:pointer; margin-left:16px;";
    clearBtn.onclick = () => {
      selectedProducts = [];
      saveSelectedProductsToStorage();
      updateSelectedProductsList();
      // If products are currently displayed, update their highlight
      if (categoryFilter.value) {
        loadProducts().then((products) => {
          const filtered = products.filter(
            (product) => product.category === categoryFilter.value
          );
          displayProducts(filtered);
        });
      }
    };
  }

  // Only show the Clear All button if there are products selected
  if (selectedProducts.length > 0) {
    flexHeader.appendChild(header);
    flexHeader.appendChild(clearBtn);
  } else {
    flexHeader.appendChild(header);
  }

  // Insert the flex header at the top of the selected-products container
  // Remove any existing h2 to avoid duplicates
  const oldHeader = selectedProductsContainer.querySelector("h2");
  if (oldHeader) oldHeader.remove();
  selectedProductsContainer.insertBefore(
    flexHeader,
    selectedProductsContainer.firstChild
  );

  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `<div class="placeholder-message">No products selected.</div>`;
    if (clearBtn) clearBtn.remove();
    return;
  }

  selectedProductsList.innerHTML = selectedProducts
    .map(
      (product) => `
      <div class="selected-product-item" data-product-id="${product.id}" style="display: flex; align-items: center; gap: 8px;">
        <img src="${product.image}" alt="${product.name}" style="width:40px; height:40px; object-fit:contain;">
        <span>${product.name}</span>
        <button class="remove-selected-btn" title="Remove" aria-label="Remove ${product.name}" style="margin-left:4px; background:none; border:none; color:#c00; font-size:18px; cursor:pointer;">&times;</button>
      </div>
    `
    )
    .join("");

  // Add event listeners to remove buttons
  const removeBtns = selectedProductsList.querySelectorAll(
    ".remove-selected-btn"
  );
  removeBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const parent = btn.closest(".selected-product-item");
      const productId = parent.getAttribute("data-product-id");
      // Remove from selectedProducts
      selectedProducts = selectedProducts.filter((p) => p.id != productId);
      saveSelectedProductsToStorage();
      // Update UI
      // If products are currently displayed, update their highlight
      if (categoryFilter.value) {
        loadProducts().then((products) => {
          const filtered = products.filter(
            (product) => product.category === categoryFilter.value
          );
          displayProducts(filtered);
        });
      }
      updateSelectedProductsList();
    });
  });
}

/* Add a search input for filtering products by name or keyword */
let searchTerm = "";
const searchInput = document.createElement("input");
searchInput.type = "text";
searchInput.id = "productSearch";
searchInput.placeholder = "Search products by name or keyword...";
searchInput.style =
  "width:100%;margin-bottom:12px;padding:12px;font-size:17px;border:1.5px solid #bbb;border-radius:6px;";
const searchSection = document.querySelector(".search-section");
searchSection.parentNode.insertBefore(searchInput, searchSection.nextSibling);

/* Listen for input in the search field */
searchInput.addEventListener("input", async (e) => {
  searchTerm = e.target.value.trim().toLowerCase();
  // Re-filter and display products
  filterAndDisplayProducts();
});

/* Listen for changes in the category filter as well */
categoryFilter.addEventListener("change", async (e) => {
  filterAndDisplayProducts();
});

/* Helper function to filter and display products based on category and search */
async function filterAndDisplayProducts() {
  const products = await loadProducts();
  const selectedCategory = categoryFilter.value;
  let filteredProducts = products;

  // Filter by category if selected
  if (selectedCategory) {
    filteredProducts = filteredProducts.filter(
      (product) => product.category === selectedCategory
    );
  }

  // Filter by search term if present
  if (searchInput.value.trim() !== "") {
    const term = searchInput.value.trim().toLowerCase();
    filteredProducts = filteredProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(term) ||
        product.brand.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term)
    );
  }

  displayProducts(filteredProducts);
}

/* When the "Generate Routine" button is clicked, send selected products to the AI and show the routine */
generateRoutineBtn.addEventListener("click", async () => {
  // If no products are selected, show a message and stop
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML =
      "Please select at least one product to generate a routine.";
    return;
  }

  // Show a loading message while waiting for the AI
  chatWindow.innerHTML = "Generating your routine...";

  // Prepare the data to send: only name, brand, category, and description for each product
  const productsForAI = selectedProducts.map((product) => ({
    name: product.name,
    brand: product.brand,
    category: product.category,
    description: product.description,
  }));

  // Add the user's product selection to the conversation history
  conversationHistory = [
    conversationHistory[0], // system prompt
    {
      role: "user",
      content: `Here are the selected products as JSON:\n${JSON.stringify(
        productsForAI,
        null,
        2
      )}`,
    },
  ];

  try {
    // Send the request to the Cloudflare Worker endpoint
    const response = await fetch(
      "https://loreal-worker.robertalamo.workers.dev/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: conversationHistory,
          // Use a model that supports web search/browsing
          model: "gpt-4o-search-preview",
        }),
      }
    );

    // Parse the response as JSON
    const data = await response.json();

    // Check if the AI returned a routine
    if (
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      // Add the assistant's reply to the conversation history
      conversationHistory.push({
        role: "assistant",
        content: data.choices[0].message.content,
      });

      // Show the routine in the chat window
      let routineHtml = data.choices[0].message.content.replace(/\n/g, "<br>");
      // Convert [text](url) markdown links to clickable HTML links
      routineHtml = routineHtml.replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
      );
      chatWindow.innerHTML = routineHtml;
    } else {
      chatWindow.innerHTML =
        "Sorry, I couldn't generate a routine. Please try again.";
    }
  } catch (error) {
    chatWindow.innerHTML =
      "There was an error connecting to the AI. Please try again.";
  }
});

/* Chat form submission handler - now supports follow-up questions */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get the user's question from the input box
  const userInput = document.getElementById("userInput").value.trim();
  if (!userInput) return;

  // Add the user's question to the conversation history
  conversationHistory.push({
    role: "user",
    content: userInput,
  });

  // Show the user's question and a loading message in the chat window
  chatWindow.innerHTML += `<div style="margin-top:12px;"><strong>You:</strong> ${userInput}</div>`;
  chatWindow.innerHTML += `<div style="margin-top:8px;">Thinking...</div>`;

  // Clear the input box
  document.getElementById("userInput").value = "";

  try {
    // Send the updated conversation history to the Cloudflare Worker endpoint
    const response = await fetch(
      "https://loreal-worker.robertalamo.workers.dev/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: conversationHistory,
          // Use a model that supports web search/browsing
          model: "gpt-4o-search-preview",
        }),
      }
    );

    // Parse the response as JSON
    const data = await response.json();

    // Check if the AI returned a reply
    if (
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      // Add the assistant's reply to the conversation history
      conversationHistory.push({
        role: "assistant",
        content: data.choices[0].message.content,
      });

      // Show the assistant's reply in the chat window
      let replyHtml = data.choices[0].message.content.replace(/\n/g, "<br>");
      // Convert [text](url) markdown links to clickable HTML links
      replyHtml = replyHtml.replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
      );
      chatWindow.innerHTML += `<div style="margin-top:8px;"><strong>Assistant:</strong> ${replyHtml}</div>`;
      // Scroll to bottom
      chatWindow.scrollTop = chatWindow.scrollHeight;
    } else {
      chatWindow.innerHTML +=
        "<div>Sorry, I couldn't answer that. Please try again.</div>";
    }
  } catch (error) {
    chatWindow.innerHTML +=
      "<div>There was an error connecting to the AI. Please try again.</div>";
  }
});

/* On page load, restore selected products from localStorage and update UI */
loadSelectedProductsFromStorage();
updateSelectedProductsList();

// Show initial placeholder until user selects a category or types in search
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category or use the search box to view products
  </div>
`;