import { env } from "@/env"

export const ROUTES = {
  auth: env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
  afterLogin: env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL,
  ssoCb: "/sso-callback"
}

export const FILENAMES: Record<string, string> = {
  // JavaScript/TypeScript
  javascript: "script.js",
  js: "script.js",
  typescript: "script.ts",
  ts: "script.ts",
  jsx: "component.jsx",
  tsx: "component.tsx",

  // Web
  html: "index.html",
  css: "styles.css",
  scss: "styles.scss",
  sass: "styles.sass",
  less: "styles.less",

  // Data
  json: "data.json",
  yaml: "config.yaml",
  yml: "config.yml",
  xml: "data.xml",

  // Shell/Config
  bash: "script.sh",
  sh: "script.sh",
  shell: "script.sh",
  zsh: "script.zsh",
  fish: "script.fish",

  // Languages
  python: "script.py",
  py: "script.py",
  java: "Main.java",
  c: "main.c",
  cpp: "main.cpp",
  cxx: "main.cpp",
  cc: "main.cpp",
  "c++": "main.cpp",
  csharp: "Program.cs",
  "c#": "Program.cs",
  cs: "Program.cs",
  go: "main.go",
  golang: "main.go",
  rust: "main.rs",
  rs: "main.rs",
  php: "index.php",
  ruby: "script.rb",
  rb: "script.rb",
  swift: "main.swift",
  kotlin: "Main.kt",
  kt: "Main.kt",
  scala: "Main.scala",
  r: "script.R",
  perl: "script.pl",
  pl: "script.pl",
  lua: "script.lua",

  // Database
  sql: "query.sql",
  mysql: "query.sql",
  postgresql: "query.sql",
  sqlite: "query.sql",

  // Config/Docker
  dockerfile: "Dockerfile",
  docker: "Dockerfile",
  makefile: "Makefile",
  make: "Makefile",
  toml: "config.toml",
  ini: "config.ini",
  conf: "config.conf",

  // Markup
  markdown: "README.md",
  md: "README.md",
  mdx: "README.mdx",

  // Other
  graphql: "schema.graphql",
  gql: "schema.graphql",
  diff: "changes.diff",
  patch: "changes.patch",
  text: "file.txt",
  txt: "file.txt",
  plain: "file.txt",

  // Frameworks
  vue: "component.vue",
  svelte: "component.svelte",

  // Assembly/Low-level
  asm: "code.asm",
  assembly: "code.asm",

  // Functional
  haskell: "main.hs",
  hs: "main.hs",
  elm: "Main.elm",
  clojure: "core.clj",
  clj: "core.clj"
}
