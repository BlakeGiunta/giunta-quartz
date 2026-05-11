import { promises as fs } from "node:fs"
import path from "node:path"

const contentRoot = path.join(process.cwd(), "content")
const indexPath = path.join(contentRoot, "index.md")

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function collectMarkdownFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const markdownFiles = []

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue
    }

    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      markdownFiles.push(...(await collectMarkdownFiles(entryPath)))
      continue
    }

    if (!entry.name.endsWith(".md")) {
      continue
    }

    if (entryPath === indexPath) {
      continue
    }

    markdownFiles.push(entryPath)
  }

  return markdownFiles
}

async function main() {
  if (!(await fileExists(contentRoot))) {
    await fs.mkdir(contentRoot, { recursive: true })
  }

  if (await fileExists(indexPath)) {
    console.log("content/index.md already exists; leaving it unchanged.")
    return
  }

  const files = await collectMarkdownFiles(contentRoot)
  const links = files
    .sort((left, right) => left.localeCompare(right))
    .map((filePath) => path.relative(contentRoot, filePath).replace(/\\/g, "/").replace(/\.md$/, ""))

  const body = [
    "---",
    'title: "Giunta Case Vault"',
    "---",
    "",
    "# Giunta Case Vault",
    "",
    "Use the sidebar to browse published notes.",
    "",
    "## Published Notes",
    ...links.map((link) => `- [[${link}]]`),
  ].join("\n")

  await fs.writeFile(indexPath, `${body}\n`, "utf8")
  console.log(`Created fallback homepage at ${indexPath}`)
}

await main()