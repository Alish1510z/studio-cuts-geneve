// Menu mobile
const menuToggle = document.getElementById("menuToggle");
const nav = document.getElementById("nav");

if (menuToggle && nav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  document.querySelectorAll("#nav a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

// Année automatique dans le footer
const yearElement = document.getElementById("year");
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}
// Prochaines disponibilités : Coupe homme
async function loadNextSlots() {
  const container = document.getElementById("next-slots");

  if (!container) return;

  container.setAttribute("aria-busy", "true");

  const start = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + 14);

  const params = new URLSearchParams({
    username: "alish-dr2ab6",
    eventTypeSlug: "coupe-homme",
    start: start.toISOString(),
    end: end.toISOString(),
    timeZone: "Europe/Zurich",
    format: "range"
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(
      `https://api.cal.com/v2/slots?${params.toString()}`,
      {
        headers: {
          "cal-api-version": "2024-09-04"
        },
        signal: controller.signal
      }
    );

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Cal.com HTTP ${response.status} : ${details}`);
    }

    const result = await response.json();

    if (result.status !== "success" || !result.data) {
      throw new Error(
        `Réponse Cal.com inattendue : ${JSON.stringify(result)}`
      );
    }

    const slots = Object.values(result.data)
      .flat()
      .map((slot) => new Date(
        typeof slot === "string" ? slot : slot.start
      ))
      .filter((date) =>
        !Number.isNaN(date.getTime()) && date.getTime() > Date.now()
      )
      .sort((a, b) => a.getTime() - b.getTime());

    const uniqueSlots = slots.filter((date, index, array) =>
      index === 0 ||
      date.getTime() !== array[index - 1].getTime()
    );

    container.replaceChildren();

    if (uniqueSlots.length === 0) {
      const message = document.createElement("p");
      message.className = "availability-message";
      message.textContent =
        "Aucun créneau disponible dans les 14 prochains jours.";
      container.appendChild(message);
      return;
    }

    const dateFormatter = new Intl.DateTimeFormat("fr-CH", {
      timeZone: "Europe/Zurich",
      weekday: "short",
      day: "numeric",
      month: "short"
    });

    const timeFormatter = new Intl.DateTimeFormat("fr-CH", {
      timeZone: "Europe/Zurich",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });

    uniqueSlots.slice(0, 3).forEach((date) => {
      const row = document.createElement("div");
      row.className = "slot";

      const label = document.createElement("span");
      label.textContent =
        `${dateFormatter.format(date)} — ${timeFormatter.format(date)}`;

      const link = document.createElement("a");
      link.className = "slot-link";
      link.textContent = "Réserver";
      link.href = "https://cal.com/alish-dr2ab6/coupe-homme";
      link.target = "_blank";
      link.rel = "noopener";

      row.append(label, link);
      container.appendChild(row);
    });
  } catch (error) {
    console.error("Chargement des disponibilités Cal.com :", error);

    const message = document.createElement("p");
    message.className = "availability-message";
    message.textContent =
      "Impossible de charger les créneaux. Consultez le calendrier via le lien ci-dessous.";

    container.replaceChildren(message);
  } finally {
    clearTimeout(timeout);
    container.setAttribute("aria-busy", "false");
  }
}

loadNextSlots();