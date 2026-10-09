const NAV_LINKS = [
    ["index.html", "Home"],
    ["browserhistory.html", "Browser History"],
    ["earlybrowsers.html", "Early Browsers"],
    ["popularbrowsers.html", "Popular Browsers"],
    ["browserwars.html", "Browser Wars"],
    ["browserfuture.html", "Future of Browsers"],
    ["keyconcepts.html", "Key Concepts"],
    ["references.html", "References"],
    ["about.html", "About"]
];

function buildNav() {
    const nav = document.getElementById("main-nav");
    if (!nav) {
        return;
    }
    
    let currentPage = window.location.pathname.split("/").pop();
    if (currentPage === "") {
        currentPage = "index.html";
    }

    const list = document.createElement("ul");

    NAV_LINKS.forEach(function (item) {
        const li = document.createElement("li");
        const link = document.createElement("a");
        link.href = item[0];
        link.textContent = item[1];

        // Mark the current page so the CSS can highlight it
        if (item[0] === currentPage) {
            link.setAttribute("aria-current", "page");
        }

        li.appendChild(link);
        list.appendChild(li);
    });

    // Replace the fallback link with the full menu
    nav.replaceChildren(list);
}

document.addEventListener("DOMContentLoaded", buildNav);
