# Corpus Encolpiorum

Baza de date a crucilor-encolpion medievale. Site static generat din fișe JSON.

- `data/piese/<id>.json` — o fișă pe piesă (aceeași structură ca în baza de date de validare)
- `img/thumb/<id>_{av,rv}.jpg` — miniaturi (≈260 px); `img/full/<id>_{av,rv}.jpg` — imagini (≈560 px)
- `assets/` — stil, scripturi, conturul hărții
- `node build.js` → `site/` (publicat automat pe GitHub Pages de `.github/workflows/pages.yml`)

Actualizare: se adaugă/modifică fișele și imaginile, se face commit și push; site-ul se regenerează singur.
