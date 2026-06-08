// --- ส่วนของข้อมูลและตัวแปรเดิม (ห้ามลบ) ---
let cart = JSON.parse(localStorage.getItem('sr_cart')) || {};
let priceList = JSON.parse(localStorage.getItem('sr_prices')) || {};
let mainComments = JSON.parse(localStorage.getItem('sr_main_comments')) || [];
let currentUser = JSON.parse(localStorage.getItem('sr_user')) || null;
let currentLang = localStorage.getItem('sr_lang') || 'th';
let currentArea = JSON.parse(localStorage.getItem('sr_area')) || { api: 'Thai', th: 'ไทย', en: 'THAILAND' };

// ระบบแปลภาษาที่เพิ่มเข้าไป
const langData = {
    th: { 
        title: "เมนูยอดนิยมทั่วโลก", cart: "🛒 ตะกร้าสินค้า", total: "ราคารวม:", close: "ปิดหน้าต่าง", 
        login: "เข้าสู่ระบบ", country: "ประเทศ: ", commentPH: "พิมพ์ข้อความที่นี่...", 
        sidebar: "เลือกประเทศ", commentTitle: "ความคิดเห็น", loginSub: "กรุณาเข้าสู่ระบบ", send: "ส่งข้อมูล"
    },
    en: { 
        title: "GLOBAL POPULAR MENU", cart: "MY CART", total: "TOTAL:", close: "CLOSE", 
        login: "LOG IN", country: "COUNTRY: ", commentPH: "Type your comment...", 
        sidebar: "SELECT COUNTRY", commentTitle: "COMMENTS", loginSub: "Please Login", send: "SEND"
    }
};

// --- ฟังก์ชันเดิมที่มีอยู่แล้ว (ห้ามลบ) ---
function closeAll() {
    document.getElementById('globalOverlay').classList.add('hidden');
    document.getElementById('cartModal').style.display = 'none';
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('detailModal').style.display = 'none';
    document.getElementById('sidebar').classList.remove('open');
}

function openSidebar() {
    document.getElementById('globalOverlay').classList.remove('hidden');
    document.getElementById('sidebar').classList.add('open');
}

function openCart() {
    renderCart();
    document.getElementById('globalOverlay').classList.remove('hidden');
    document.getElementById('cartModal').style.display = 'block';
}

function openLogin() {
    closeAll();
    document.getElementById('globalOverlay').classList.remove('hidden');
    document.getElementById('loginModal').style.display = 'block';
}

async function openDetail(id) {
    const content = document.getElementById('detailContent');
    content.innerHTML = `<p class="text-center py-20 italic font-bold">กำลังเปิดตำราอาหาร...</p>`;
    document.getElementById('globalOverlay').classList.remove('hidden');
    document.getElementById('detailModal').style.display = 'block';

    try {
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
        const data = await res.json();
        const meal = data.meals[0];
        let ing = "";
        for (let i = 1; i <= 20; i++) {
            if (meal[`strIngredient${i}`]) ing += `<span class="ingredient-tag">${meal[`strIngredient${i}`]}</span>`;
        }
        content.innerHTML = `
            <img src="${meal.strMealThumb}" class="w-full h-72 object-cover rounded-[3rem] mb-8 shadow-md">
            <h2 class="text-4xl font-black italic uppercase mb-2 tracking-tighter">${meal.strMeal}</h2>
            <p class="text-orange-900 font-bold text-xs uppercase mb-8 tracking-widest">${meal.strCategory} | ${meal.strArea}</p>
            <h3 class="font-black italic text-lg mb-4 uppercase border-b-4 border-[#3D2B1F] inline-block text-[#3D2B1F]">Ingredients</h3>
            <div class="mb-10 flex flex-wrap">${ing}</div>
            <h3 class="font-black italic text-lg mb-4 uppercase border-b-4 border-[#3D2B1F] inline-block text-[#3D2B1F]">Instructions</h3>
            <p class="text-gray-600 text-sm leading-relaxed whitespace-pre-line text-justify">${meal.strInstructions}</p>
        `;
    } catch (e) { content.innerHTML = "Error loading data."; }
}

// --- ฟังก์ชันที่ปรับปรุงและเพิ่มใหม่ (หน้าปก Global) ---

async function loadMeals(api, th, en) {
    currentArea = { api, th, en };
    localStorage.setItem('sr_area', JSON.stringify(currentArea));
    const grid = document.getElementById('mealGrid');
    document.getElementById('mainTitle').innerText = (currentLang === 'th' ? th : en);
    document.getElementById('subCountry').innerText = `${langData[currentLang].country} ${currentLang === 'th' ? th : en}`;
    grid.innerHTML = `<div class="col-span-full text-center py-20 italic opacity-50 font-bold uppercase tracking-widest animate-pulse">Cooking...</div>`;

    try {
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?a=${api}`);
        const data = await res.json();
        renderItems(data.meals.slice(0, 9), false);
    } catch (e) { grid.innerHTML = "Error."; }
}

async function loadGlobalCover() {
    const grid = document.getElementById('mealGrid');
    document.getElementById('mainTitle').innerText = langData[currentLang].title;
    document.getElementById('subCountry').innerText = (currentLang === 'th' ? "เมนูแนะนำจากทั่วทุกมุมโลก" : "WORLDWIDE BEST SELLERS");
    grid.innerHTML = `<div class="col-span-full text-center py-20 italic opacity-50 font-bold uppercase tracking-widest animate-pulse">Global Cooking...</div>`;

    const areas = ['Thai', 'Japanese', 'Italian', 'French', 'Chinese'];
    let allMeals = [];
    try {
        for (let a of areas) {
            const res = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?a=${a}`);
            const data = await res.json();
            if (data.meals) allMeals = [...allMeals, ...data.meals.slice(0, 2)];
        }
        allMeals.sort(() => Math.random() - 0.5);
        renderItems(allMeals.slice(0, 9), true);
    } catch (e) { grid.innerHTML = "Error."; }
}

function renderItems(meals, isGlobal) {
    const grid = document.getElementById('mealGrid');
    grid.innerHTML = meals.map(meal => {
        if (!priceList[meal.strMeal]) {
            priceList[meal.strMeal] = (Math.floor(Math.random() * 19) * 5) + 60; 
            localStorage.setItem('sr_prices', JSON.stringify(priceList));
        }
        const price = priceList[meal.strMeal];
        const qty = cart[meal.strMeal] || 0;
        const addCall = isGlobal ? `addGlobal('${meal.strMeal}', 1)` : `add('${meal.strMeal}', 1)`;
        const subCall = isGlobal ? `addGlobal('${meal.strMeal}', -1)` : `add('${meal.strMeal}', -1)`;

        return `
            <div class="food-card border shadow-sm">
                <img src="${meal.strMealThumb}" onclick="openDetail('${meal.idMeal}')" class="w-full h-72 object-cover cursor-pointer hover:opacity-90 transition">
                <div class="p-10 text-center">
                    <h3 onclick="openDetail('${meal.idMeal}')" class="font-black italic uppercase text-sm mb-5 truncate cursor-pointer hover:text-orange-900">${meal.strMeal}</h3>
                    <p class="text-3xl font-black text-[#722F11] mb-8 italic">${price} B</p>
                    <div class="flex items-center justify-center gap-8">
                        <button onclick="${subCall}" class="w-12 h-12 border-2 border-[#3D2B1F] rounded-full font-bold hover:bg-gray-100">-</button>
                        <span class="font-black text-2xl">${qty}</span>
                        <button onclick="${addCall}" class="w-12 h-12 bg-[#3D2B1F] text-white rounded-full font-bold shadow-xl hover:scale-125 transition">+</button>
                    </div>
                </div>
            </div>`;
    }).join('');
}

function add(name, change) {
    cart[name] = Math.max(0, (cart[name] || 0) + change);
    if (cart[name] === 0) delete cart[name];
    localStorage.setItem('sr_cart', JSON.stringify(cart));
    loadMeals(currentArea.api, currentArea.th, currentArea.en);
    updateBadge();
}

function addGlobal(name, change) {
    cart[name] = Math.max(0, (cart[name] || 0) + change);
    if (cart[name] === 0) delete cart[name];
    localStorage.setItem('sr_cart', JSON.stringify(cart));
    loadGlobalCover();
    updateBadge();
}

function toggleLang() {
    currentLang = currentLang === 'th' ? 'en' : 'th';
    localStorage.setItem('sr_lang', currentLang);
    location.reload(); 
}

function applyLanguage() {
    const d = langData[currentLang];
    const elements = {
        't-cartHeader': d.cart, 't-total': d.total, 't-close': d.close,
        'mainCommentInput': d.commentPH, 't-sidebarTitle': d.sidebar,
        't-commentTitle': d.commentTitle, 't-loginSub': d.loginSub,
        't-loginSubmit': d.login, 't-send': d.send
    };
    for (let id in elements) {
        let el = document.getElementById(id);
        if (el) el.placeholder ? el.placeholder = elements[id] : el.innerText = elements[id];
    }
}

// ฟังก์ชันอื่นๆ (Login, Logout, Comments) ยังคงเดิม
function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value.trim();
    if (email.includes('@') && pass.length >= 4) {
        currentUser = { name: email.split('@')[0].toUpperCase(), img: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}` };
        localStorage.setItem('sr_user', JSON.stringify(currentUser));
        location.reload();
    } else { alert("Error!"); }
}

function handleLogout() { localStorage.removeItem('sr_user'); location.reload(); }

function sendMainComment() {
    if (!currentUser) return openLogin();
    const input = document.getElementById('mainCommentInput');
    if (input.value.trim()) {
        mainComments.unshift({ user: currentUser.name, img: currentUser.img, text: input.value, date: new Date().toLocaleString() });
        localStorage.setItem('sr_main_comments', JSON.stringify(mainComments));
        input.value = ''; renderMainComments();
    }
}

function renderMainComments() {
    const list = document.getElementById('mainCommentList');
    if (!list) return;
    list.innerHTML = mainComments.map(c => `<div class="comment-card shadow-sm"><div class="flex gap-4 items-center"><img src="${c.img}" class="w-12 h-12 rounded-full border"><div><h4 class="font-black italic text-sm">${c.user}</h4><p class="text-gray-700 text-sm">${c.text}</p></div></div></div>`).join('');
}

function updateBadge() {
    const totalQty = Object.values(cart).reduce((a, b) => a + b, 0);
    const b = document.getElementById('cartCount');
    if(b) { b.innerText = totalQty; b.classList.toggle('hidden', totalQty === 0); }
}

function renderCart() {
    const list = document.getElementById('cartItems');
    let total = 0;
    list.innerHTML = Object.entries(cart).map(([name, qty]) => {
        const p = priceList[name] * qty; total += p;
        return `<div class="flex justify-between items-center bg-gray-50 p-6 rounded-[2.5rem] mb-2 font-bold text-xs uppercase"><span>${name}</span><span>${p} B</span></div>`;
    }).join('') || `<p class="text-center py-10 opacity-30">EMPTY</p>`;
    document.getElementById('cartTotal').innerText = total + ' B';
}

window.onload = () => {
    applyLanguage();
    const countries = [
        { th: "ไทย", en: "THAILAND", api: "Thai" },
        { th: "ญี่ปุ่น", en: "JAPAN", api: "Japanese" },
        { th: "อิตาลี", en: "ITALY", api: "Italian" },
        { th: "ฝรั่งเศส", en: "FRANCE", api: "French" },
        { th: "จีน", en: "CHINA", api: "Chinese" }
    ];
    document.getElementById('areaLinks').innerHTML = countries.map(c => `<button onclick="closeAll(); loadMeals('${c.api}', '${c.th}', '${c.en}')" class="text-5xl font-black italic uppercase text-left hover:text-orange-900 transition text-[#3D2B1F]">${c.en}</button>`).join('');
    
    // สำคัญ: ให้โหลดหน้าปก Global เป็นค่าเริ่มต้น
    loadGlobalCover(); 
    
    updateBadge();
    renderMainComments();
    if (currentUser) {
        document.getElementById('userSection').classList.remove('hidden');
        document.getElementById('loginBtnTrigger').classList.add('hidden');
        document.getElementById('userAvatar').src = currentUser.img;
        document.getElementById('userName').innerText = currentUser.name;
    }
};