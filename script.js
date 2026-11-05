const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".nav");

function setMenu(open) {
  navigation.classList.toggle("open", open);
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
}

menuButton.addEventListener("click", () => setMenu(!navigation.classList.contains("open")));
navigation.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMenu(false);
});

document.querySelector("#year").textContent = new Date().getFullYear();

// Blocos entram ao aparecer na tela.
const revealTargets = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries, current) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          current.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealTargets.forEach((element) => observer.observe(element));
} else {
  revealTargets.forEach((element) => element.classList.add("visible"));
}

// Certificado ampliado.
const dialog = document.querySelector(".certificate-dialog");
const dialogImage = document.querySelector(".dialog-image");

document.querySelectorAll("[data-certificate]").forEach((button) => {
  button.addEventListener("click", () => {
    dialogImage.src = button.dataset.certificate;
    dialogImage.alt = button.querySelector("img").alt;
    dialog.showModal();
  });
});

document.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});
