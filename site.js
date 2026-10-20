/* Les Habitations Godin-Savoie inc. — interactions */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.remove("no-js");
  doc.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var cleanups = [];

  /* ---------- Menu mobile ---------- */
  var btn = document.querySelector(".menu-btn");
  var nav = document.getElementById("nav");
  if (btn && nav) {
    var setOpen = function (open) {
      nav.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
      btn.textContent = open ? "Fermer" : "Menu";
    };
    btn.addEventListener("click", function () { setOpen(btn.getAttribute("aria-expanded") !== "true"); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") { setOpen(false); btn.focus(); }
    });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
  }

  /* ---------- Révélations ---------- */
  var reveals = document.querySelectorAll(".reveal, .chrono-steps li");
  if ("IntersectionObserver" in window && !reduce.matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.05 });
    reveals.forEach(function (el) { io.observe(el); });
    cleanups.push(function () { io.disconnect(); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Scène signature : la véranda, de l'avant au livré ----------
     Départ : la vieille véranda. Le scroll « coupe » chaque photo de haut en bas
     (ligne rouge = trait de scie) jusqu'à la véranda livrée. */
  var chrono = document.querySelector("[data-chrono]");
  if (chrono) {
    var track = chrono.querySelector(".chrono-track");
    var frames = chrono.querySelectorAll(".chrono-stage figure");
    var cut = chrono.querySelector(".cut");
    var stamp = chrono.querySelector(".stamp");
    var steps = chrono.querySelectorAll(".chrono-steps li");
    var bar = chrono.querySelector(".chrono-bar span");
    var desk = window.matchMedia("(min-width: 861px)");
    var ticking = false;
    var n = frames.length;

    var render = function () {
      ticking = false;
      if (!desk.matches || reduce.matches) return;
      var r = track.getBoundingClientRect();
      var total = r.height - window.innerHeight;
      var p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
      var seg = p * (n - 1);                 // 0 → 3
      var active = Math.min(n - 1, Math.round(seg));
      var cutting = false;
      for (var i = 1; i < n; i++) {
        var local = Math.min(1, Math.max(0, seg - (i - 1)));     // progression de la coupe i
        var eased = local < 0.5 ? 2 * local * local : 1 - Math.pow(-2 * local + 2, 2) / 2;
        frames[i].style.clipPath = "inset(0 0 " + ((1 - eased) * 100).toFixed(2) + "% 0)";
        if (local > 0.01 && local < 0.99) {
          cutting = true;
          cut.style.top = (eased * 100).toFixed(2) + "%";
        }
      }
      cut.style.opacity = cutting ? "1" : "0";
      steps.forEach(function (li, k) {
        var on = k === active;
        li.classList.toggle("is-on", on);
        if (on) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
      });
      if (stamp) stamp.textContent = steps[active].getAttribute("data-stamp") || "";
      if (bar) bar.style.width = (p * 100).toFixed(1) + "%";
    };
    var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(render); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    render();
    cleanups.push(function () {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    });
  }

  /* ---------- Filtres des réalisations ---------- */
  var filterBar = document.querySelector("[data-filters]");
  if (filterBar) {
    var projects = document.querySelectorAll(".project");
    var live = document.getElementById("filter-live");
    filterBar.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-filter]");
      if (!b) return;
      var f = b.getAttribute("data-filter");
      filterBar.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      var shown = 0;
      projects.forEach(function (pr) {
        var ok = f === "tous" || (pr.getAttribute("data-cat") || "").split(" ").indexOf(f) > -1;
        pr.hidden = !ok;
        if (ok) shown++;
      });
      if (live) live.textContent = shown + (shown > 1 ? " projets affichés" : " projet affiché");
    });
  }

  /* ---------- Visionneuse ---------- */
  var lb = document.getElementById("lightbox");
  if (lb && typeof lb.showModal === "function") {
    var lbImg = lb.querySelector("img");
    var lbCap = lb.querySelector(".lb-cap");
    var list = [], idx = 0, opener = null;
    var show = function (i) {
      idx = (i + list.length) % list.length;
      var b = list[idx];
      lbImg.src = b.getAttribute("data-full");
      lbImg.alt = b.querySelector("img").alt;
      lbCap.textContent = b.getAttribute("data-cap") || lbImg.alt;
    };
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-full]");
      if (!b) return;
      var group = b.closest(".gallery");
      list = Array.prototype.slice.call(group.querySelectorAll("[data-full]"));
      opener = b;
      show(list.indexOf(b));
      lb.showModal();
    });
    lb.querySelector("[data-lb-prev]").addEventListener("click", function () { show(idx - 1); });
    lb.querySelector("[data-lb-next]").addEventListener("click", function () { show(idx + 1); });
    lb.querySelector("[data-lb-close]").addEventListener("click", function () { lb.close(); });
    lb.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener("close", function () { if (opener) opener.focus(); });
  }

  /* ---------- Formulaire de soumission ---------- */
  var form = document.querySelector("form.quote-form");
  if (form) {
    var status = form.querySelector(".form-status");
    var submit = form.querySelector("[type=submit]");
    var success = document.getElementById("form-success");
    var EMAIL = form.getAttribute("data-mailto");

    var setErr = function (wrap, on) { if (wrap) wrap.classList.toggle("has-err", on); };
    var validate = function () {
      var bad = [];
      form.querySelectorAll("[data-req]").forEach(function (el) {
        var wrap = el.closest(".field");
        var ok = el.value.trim() !== "";
        if (ok && el.type === "email") ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim());
        if (ok && el.type === "tel") ok = el.value.replace(/\D/g, "").length >= 10;
        el.setAttribute("aria-invalid", String(!ok));
        setErr(wrap, !ok);
        if (!ok) bad.push(el);
      });
      var types = form.querySelector("[data-req-group]");
      if (types) {
        var any = types.querySelector("input:checked");
        setErr(types, !any);
        if (!any) bad.unshift(types.querySelector("input"));
      }
      return bad;
    };

    var summary = function (fd) {
      var lines = [];
      lines.push("Demande de soumission — site web");
      lines.push("");
      lines.push("Type de projet : " + fd.getAll("type").join(", "));
      lines.push("Ville : " + (fd.get("ville") || ""));
      lines.push("Échéance : " + (fd.get("echeance") || ""));
      lines.push("Budget : " + (fd.get("budget") || ""));
      lines.push("");
      lines.push("Description :");
      lines.push(fd.get("description") || "");
      lines.push("");
      lines.push("Nom : " + (fd.get("nom") || ""));
      lines.push("Téléphone : " + (fd.get("telephone") || ""));
      lines.push("Courriel : " + (fd.get("courriel") || ""));
      lines.push("Meilleur moment pour rappeler : " + (fd.get("moment") || ""));
      return lines.join("\n");
    };

    var showSuccess = function (text, viaEmail) {
      form.hidden = true;
      success.classList.add("is-on");
      var pre = success.querySelector("pre");
      if (pre) pre.textContent = text;
      var mail = success.querySelector("[data-mail]");
      var emailBlock = success.querySelector("[data-email-step]");
      if (emailBlock) emailBlock.hidden = !viaEmail;
      if (mail && viaEmail) {
        mail.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Demande de soumission — " + (new FormData(form).getAll("type").join(", "))) + "&body=" + encodeURIComponent(text);
      }
      success.querySelector("h2").focus();
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.className = "form-status";
      status.textContent = "";
      var bad = validate();
      if (bad.length) {
        status.className = "form-status is-error";
        status.textContent = bad.length === 1 ? "Un champ est à corriger." : bad.length + " champs sont à corriger.";
        bad[0].focus();
        return;
      }
      if (form.querySelector("[name=_site]").value) return; // anti-robot
      var fd = new FormData(form);
      var text = summary(fd);
      var endpoint = form.getAttribute("data-endpoint");
      if (!endpoint) { showSuccess(text, true); return; }

      submit.disabled = true;
      var label = submit.textContent;
      submit.textContent = "Envoi en cours…";
      status.className = "form-status is-loading";
      status.textContent = "Envoi de votre demande…";
      fetch(endpoint, { method: "POST", body: fd, headers: { Accept: "application/json" } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); showSuccess(text, false); })
        .catch(function () {
          status.className = "form-status is-error";
          status.textContent = "L'envoi n'a pas fonctionné. Réessayez, ou appelez-nous directement au 514 895-0018.";
        })
        .finally(function () { submit.disabled = false; submit.textContent = label; });
    });

    form.addEventListener("input", function (e) {
      var wrap = e.target.closest(".field.has-err, fieldset.has-err");
      if (wrap) validate();
    });

    /* Préremplissage depuis un lien : soumission.html?type=salle-de-bain */
    try {
      var pre = new URLSearchParams(location.search).get("type");
      if (pre) {
        var chip = form.querySelector('input[name=type][data-slug="' + pre.replace(/[^a-z-]/g, "") + '"]');
        if (chip) chip.checked = true;
      }
    } catch (err) { /* navigateur ancien : rien à préremplir */ }

    var copy = document.querySelector("[data-copy]");
    if (copy) copy.addEventListener("click", function () {
      var t = success.querySelector("pre").textContent;
      var done = function () { copy.textContent = "Copié"; setTimeout(function () { copy.textContent = "Copier le résumé"; }, 2000); };
      if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, function () {});
      else { var ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); done(); }
    });
  }

  window.addEventListener("pagehide", function () { cleanups.forEach(function (fn) { fn(); }); });
})();
