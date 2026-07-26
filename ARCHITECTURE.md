---
description: Aturan arsitektur wajib untuk proyek Next.js Portfolio. Berlaku untuk semua file TypeScript dan TSX. AI harus mengikuti panduan ini secara strict tanpa pengecualian.
globs: ["**/*.ts", "**/*.tsx", "!**/*.test.ts", "!**/*.test.tsx"]
alwaysApply: true
---

# Next.js Portfolio — Feature-Based Frontend Architecture

## Konteks Proyek

- Framework: Next.js 16 dengan App Router
- Language: TypeScript (strict mode) — `any` dilarang keras
- Styling: Tailwind CSS 4 + shadcn/ui
- UI Primitives: Base UI (`@base-ui/react`) + komponen kustom
- Tipe: Website portfolio statis (tidak ada backend API)
- Arsitektur: Feature-based
- Rendering: **Server Components secara default**, Client Components hanya jika diperlukan

---

## Alur Data (WAJIB dipatuhi)

```
Page (app/) → Feature Component (features/*/components/) → Data Layer (lib/data/)
```

Dependency hanya boleh mengalir **ke bawah**. Layer atas boleh memanggil layer di bawahnya, tidak boleh sebaliknya.

---

## Aturan Utama: `page.tsx` WAJIB Server Component

**Semua file `page.tsx` HARUS Server Component.** Artinya:

- ❌ DILARANG: directive `'use client'` di `page.tsx`
- ❌ DILARANG: `useState`, `useEffect`, `usePathname`, atau React hooks apapun di `page.tsx`
- ❌ DILARANG: event handler (`onClick`, `onChange`, dll) di `page.tsx`
- ❌ DILARANG: browser API (`window`, `document`, `localStorage`, dll) di `page.tsx`
- ✅ BOLEH: import & render feature component via `index.ts`
- ✅ BOLEH: mendefinisikan `metadata` (`export const metadata = { ... }`)

Jika ada komponen anak yang butuh interaktivitas client-side, **tandai komponen spesifik tersebut** dengan `'use client'`, BUKAN page-nya.

```tsx
// ✅ BENAR — app/page.tsx (Server Component)
import { HomeSection } from '@/features/home'

export default function Page() {
    return <HomeSection />
}

// ❌ SALAH — page.tsx dengan 'use client'
'use client'
export default function Page() { ... }
```

---

## Struktur Folder Wajib

```
app/                            # Next.js App Router — routing ONLY
├── layout.tsx                  # Root layout (Server Component)
├── page.tsx                    # Home page (Server Component)
├── globals.css                 # Global styles
├── about/
│   └── page.tsx
├── projects/
│   └── page.tsx
└── contact/
    └── page.tsx

features/                       # SEMUA logic & UI per fitur/halaman
├── home/                       # Fitur: Homepage
│   ├── index.ts                # PUBLIC API — satu-satunya export keluar
│   └── components/
│       ├── Hero.tsx
│       ├── Skills.tsx
│       └── RecentProjects.tsx
├── about/                      # Fitur: About
│   ├── index.ts
│   └── components/
│       └── AboutContent.tsx
├── projects/                   # Fitur: Projects
│   ├── index.ts
│   ├── components/
│   │   ├── ProjectList.tsx
│   │   └── ProjectCard.tsx
│   └── types/
│       └── project.types.ts
└── contact/                    # Fitur: Contact
    ├── index.ts
    └── components/
        └── ContactInfo.tsx

components/                     # Shared UI (lintas fitur)
├── ui/                         # Primitives: Button, dll
│   └── button.tsx
└── layout/                     # Header, Footer
    ├── Header.tsx              # 'use client' — usePathname()
    └── Footer.tsx

lib/                            # Utilities & data global
├── utils.ts                    # cn() helper
└── data/                       # Data statis — sumber tunggal
    ├── projects.ts
    ├── skills.ts
    ├── navigation.ts
    └── contact.ts

types/                          # Global types
└── index.ts
```

**Jika AI membuat file di luar struktur ini, itu adalah kesalahan.**

---

## Tanggung Jawab Setiap Layer

### `app/*/page.tsx` — Entry Point (Server Component)

**BOLEH:**

- Mendefinisikan metadata halaman (`export const metadata = { ... }`)
- Import dan render **satu** feature component utama via `index.ts`

**DILARANG:**

- Directive `'use client'`
- React hooks
- Event handler
- Browser API
- Import langsung dari dalam folder fitur (harus via `index.ts`)

```tsx
// ✅ BENAR — app/projects/page.tsx
import { ProjectListSection } from '@/features/projects'

export const metadata = {
    title: 'Proyek - Fery Irawan Portfolio',
}

export default function ProjectsPage() {
    return <ProjectListSection />
}

// ❌ SALAH — import langsung dari dalam fitur
import { ProjectList } from '@/features/projects/components/ProjectList'

// ❌ SALAH — 'use client' di page
'use client'
export default function ProjectsPage() { ... }
```

---

### `features/*/components/` — UI Murni

**BOLEH:**

- Menerima data via props (typed dengan `interface`)
- Menampilkan UI berdasarkan props
- Memanggil callback dari props untuk event
- `'use client'` jika komponen interaktif
- `useState` untuk UI state lokal (buka/tutup modal, toggle, dll)
- Import data dari `@/lib/data/`

**DILARANG:**

- Data fetching (`fetch()`, `axios`, dll)
- Business logic kompleks
- State yang berhubungan dengan data remote
- Import dari fitur lain secara langsung (harus via `index.ts`)

```tsx
// ✅ BENAR — features/home/components/Hero.tsx (Server Component)
import Link from "next/link";

export function Hero() {
  return (
    <section>
      <h1>Fery Irawan</h1>
      <Link href="/projects">Lihat Proyek</Link>
    </section>
  );
}

// ✅ BENAR — features/projects/components/ProjectCard.tsx (Server Component)
import type { Project } from "../types/project.types";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div>
      <h3>{project.name}</h3>
      <p>{project.description}</p>
    </div>
  );
}
```

---

### `features/*/types/` — TypeScript Types

**BOLEH:**

- `interface` dan `type` definitions untuk fitur tersebut
- Extend dari global types jika perlu

**DILARANG:**

- Logic apapun
- Import dari layer lain (types harus murni definisi)

```ts
// ✅ BENAR — features/projects/types/project.types.ts
export interface Project {
  id: number;
  name: string;
  category: string;
  organization: string;
  period: string;
  description: string;
  highlights: string[];
  tech: string[];
}
```

---

### `features/*/index.ts` — Public API Fitur

Ini adalah **satu-satunya** file yang boleh di-import oleh layer luar (page, fitur lain).

**Hanya export yang dibutuhkan dari luar.** Jangan export internal implementation.

```ts
// ✅ BENAR — features/projects/index.ts
export { ProjectListSection } from "./components/ProjectListSection";
export { ProjectCard } from "./components/ProjectCard";
export type { Project } from "./types/project.types";

// JANGAN export: internal sub-components yang tidak digunakan di luar
```

---

### `components/layout/` — Shared Layout Components

**BOLEH:**

- `'use client'` jika diperlukan (seperti Header dengan `usePathname`)
- Import dari `@/lib/data/` untuk data konfigurasi

```tsx
// ✅ BENAR — components/layout/Header.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks } from "@/lib/data/navigation";

export function Header() {
  const pathname = usePathname();

  return (
    <header>
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={pathname === link.href ? "font-bold" : ""}
        >
          {link.label}
        </Link>
      ))}
    </header>
  );
}
```

---

### `lib/data/` — Sumber Data Statis

**BOLEH:**

- Konstanta array/objek — data mentah
- Import type dari `@/types` atau `@/features/*/types`

**DILARANG:**

- JSX / markup
- React hooks
- Side effects

```ts
// ✅ BENAR — lib/data/projects.ts
import type { Project } from "@/features/projects/types/project.types";

export const projects: Project[] = [
  {
    id: 1,
    name: "Web Ruang PPID",
    category: "Government",
    // ...
  },
];
```

---

## Server vs Client Component — Aturan

### Server Component (default, tanpa `'use client'`)

- Semua file `page.tsx`
- Semua file `layout.tsx`
- Komponen yang hanya merender konten statis
- Komponen yang hanya menerima dan menampilkan props

### Client Component (tambah `'use client'` di baris pertama)

- Komponen yang menggunakan React hooks (`useState`, `useEffect`, `usePathname`, dll)
- Komponen dengan event handler (`onClick`, `onSubmit`, dll)
- Komponen yang menggunakan browser API
- UI primitif interaktif (Button, Modal, Dropdown, dll)

**Rule of thumb:** Mulai sebagai Server Component. Hanya tambahkan `'use client'` jika benar-benar diperlukan.

---

## Aturan TypeScript (Wajib)

- **`any` dilarang keras** — selalu definisikan type yang proper
- Semua props component harus typed dengan `interface`
- Semua return value function yang non-trivial harus typed
- Gunakan `interface` untuk object shapes, `type` untuk union/intersection
- Gunakan `unknown` bukan `any` jika tipe tidak pasti, lalu narrow dengan type guard

---

## Aturan Import (Wajib)

```ts
// ✅ BENAR — import dari public API fitur
import { ProjectListSection } from "@/features/projects";
import type { Project } from "@/features/projects";

// ✅ BENAR — import shared components
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";

// ✅ BENAR — import data
import { projects } from "@/lib/data/projects";

// ✅ BENAR — import antar file dalam fitur yang sama (relatif)
import { ProjectCard } from "./ProjectCard";
import type { Project } from "../types/project.types";

// ❌ SALAH — import langsung dari dalam folder fitur lain
import { ProjectCard } from "@/features/projects/components/ProjectCard";

// ❌ SALAH — relative path antar folder yang berjauhan
import { Header } from "../../components/layout/Header";
```

---

## Aturan Styling

- Gunakan Tailwind CSS utility classes
- Gunakan `cn()` helper dari `@/lib/utils` untuk conditional classes
- Dark mode: gunakan prefix `dark:` variant
- Komponen shadcn/ui berada di `components/ui/`

---

## Naming Convention

| Komponen       | Pola                 | Contoh                        |
| -------------- | -------------------- | ----------------------------- |
| Feature folder | kebab-case           | `home/`, `projects/`          |
| Component      | PascalCase           | `Hero.tsx`, `ProjectCard.tsx` |
| Types file     | `{feature}.types.ts` | `project.types.ts`            |
| index.ts       | `index.ts`           | `features/projects/index.ts`  |
| UI primitive   | kebab-case           | `button.tsx`                  |
| Utility file   | kebab-case           | `utils.ts`                    |
| Data file      | kebab-case           | `projects.ts`, `skills.ts`    |
| Interface      | PascalCase           | `Project`, `SkillCategory`    |

---

## Larangan Keras (Hard Rules)

AI **tidak boleh** menghasilkan kode yang:

- ❌ Menambahkan `'use client'` di file `page.tsx`
- ❌ Menggunakan tipe `any`
- ❌ Menggunakan React hooks di Server Component
- ❌ Menggunakan browser API di Server Component
- ❌ Mengimport langsung dari dalam folder fitur lain (harus via `index.ts`)
- ❌ Membuat file di luar struktur folder yang sudah ditentukan
- ❌ Menggunakan relative import untuk file di folder berbeda (gunakan `@/` alias)
- ❌ Menambahkan dependency baru tanpa izin eksplisit
