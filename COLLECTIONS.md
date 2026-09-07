# Collections

Products come from the folder structure. Nothing is listed in code.

```
image/
  sofa/        → /collections/sofa
  chairs/      → /collections/chairs
  tables/      → /collections/tables
  side-tables/ ...
  wardrobes/
  beds/
  cabinets/
  dining/
  lighting/
```

Add a folder, drop images in, run `npm run catalogue`, and the category appears
on the landing page and gets its own route. Remove the images and it disappears.
Empty folders are skipped rather than shipped as an empty page.

`.jpg`, `.jpeg`, `.jfif`, `.png`, `.webp` and `.avif` are all picked up. Source
filenames are never shown: they are sorted naturally and numbered, so products
are addressed as `sofa-01`, `sofa-02` and so on. That keeps URLs clean no matter
what the files are called — the current set includes spaces, parentheses and a
`#`, which would otherwise break a link.

## Naming

By default a product reads as "Sofa No. 04" and carries the category tagline.
To give real names and copy, drop a `_meta.json` beside the images:

```json
{
  "title": "Sofas",
  "tagline": "Curated seating",
  "intro": "A study in comfort, proportion and material.",
  "products": {
    "sofa-01": { "name": "Halden", "note": "Bouclé over kiln-dried ash" },
    "sofa-02": { "name": "Fri", "note": "Terracotta wool, oak legs" }
  }
}
```

Every field is optional and anything absent falls back to the generated value,
so you can name two products and leave the rest.

Category titles and taglines for the common folder names are built in — `sofa`,
`chair`, `table`, `side-table`, `wardrobe` (and `almira`), `bed`, `cabinet`,
`dining`, `lighting`. An unrecognised folder still works: it gets a title-cased
name from the folder itself, and `_meta.json` overrides it.

## Commands

| | |
|---|---|
| `npm run catalogue` | rebuild the catalogue only |
| `npm run prep:assets` | video, editorial stills and the catalogue |
