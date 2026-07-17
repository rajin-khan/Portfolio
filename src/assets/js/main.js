const stickyContainerClasses = [
  "border-neutral-300/50",
  "bg-white/80",
  "dark:border-neutral-600/40",
  "dark:bg-neutral-900/60",
  "backdrop-blur-2xl",
];

function initializeHeader() {
  const header = document.getElementById("header");
  const headerContainer = header?.firstElementChild;
  const menu = document.getElementById("menu");
  const openButton = document.getElementById("openMenu");
  const closeButton = document.getElementById("closeMenu");
  const backdrop = document.getElementById("mobileMenuBackground");

  if (!header || !headerContainer || !menu || !openButton || !closeButton || !backdrop) {
    return;
  }

  let stickyState = null;
  let scrollFrame = 0;

  const updateHeader = () => {
    scrollFrame = 0;
    const shouldStick = window.scrollY > 16;
    if (stickyState === shouldStick) return;
    stickyState = shouldStick;

    header.classList.toggle("fixed", shouldStick);
    header.classList.toggle("h-14", shouldStick);
    header.classList.toggle("absolute", !shouldStick);
    header.classList.toggle("h-20", !shouldStick);
    headerContainer.classList.toggle("border-transparent", !shouldStick);

    for (const className of stickyContainerClasses) {
      headerContainer.classList.toggle(className, shouldStick);
    }

    menu.classList.toggle("top-[56px]", shouldStick);
    menu.classList.toggle("top-[75px]", !shouldStick);
  };

  const queueHeaderUpdate = () => {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(updateHeader);
  };

  const setMenuOpen = (isOpen, restoreFocus = false) => {
    openButton.classList.toggle("hidden", isOpen);
    closeButton.classList.toggle("hidden", !isOpen);
    menu.classList.toggle("hidden", !isOpen);
    backdrop.classList.toggle("hidden", !isOpen);
    openButton.setAttribute("aria-expanded", String(isOpen));
    closeButton.setAttribute("aria-expanded", String(isOpen));

    if (isOpen) {
      backdrop.classList.add("opacity-0");
      window.requestAnimationFrame(() => backdrop.classList.remove("opacity-0"));
      closeButton.focus();
    } else {
      backdrop.classList.add("opacity-0");
      if (restoreFocus) openButton.focus();
    }
  };

  openButton.addEventListener("click", () => setMenuOpen(true));
  closeButton.addEventListener("click", () => setMenuOpen(false, true));
  backdrop.addEventListener("click", () => setMenuOpen(false, true));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !menu.classList.contains("hidden")) {
      setMenuOpen(false, true);
    }
  });
  window.addEventListener("scroll", queueHeaderUpdate, { passive: true });

  updateHeader();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeHeader, { once: true });
} else {
  initializeHeader();
}
