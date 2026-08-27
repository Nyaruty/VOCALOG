import { escapeHtml, getParam, loadJson, headerHtml } from "./app.js"

document.getElementById("header").innerHTML = headerHtml("producers")

const content = document.getElementById("content")
const songsBox = document.getElementById("songs")
const songsNote = document.getElementById("songsNote")
const popularBox = document.getElementById("popularSongs")
const popularNote = document.getElementById("popularNote")

const isThisWeek = (s) => (s?.isNewWeeklyPick === true) || (s?.isWeeklyPromoted === true)

function getVocalText(song, vMap) {
  if (song.vocalIds?.length) {
    return song.vocalIds
      .map(id => vMap.get(id))
      .filter(Boolean)
      .join(" / ")
  }
  if (song.vocalId) {
    return vMap.get(song.vocalId) || "不明"
  }
  return "不明"
}

function renderSongCard(song, vMap, extraClass = "") {
  return `
    <a class="card cardLink ${extraClass}".trim() href="./song.${encodeURIComponent(song.id)}">
      <h3 class="title">${escapeHtml(song.title || "無題")}</h3>
      <p class="muted">${escapeHtml(getVocalText(song, vMap))}</p>
      ${song.released ? `<p class="muted dateLabel">公開：${escapeHtml(song.released)}</p>` : ""}
      ${song.summary ? `<p class="muted">${escapeHtml(song.summary)}</p>` : ""}
    </a>
  `
}

async function main() {
  try {
    const [producers, songs, vocals] = await Promise.all([
      loadJson("./data/producers.json"),
      loadJson("./data/songs.json"),
      loadJson("./data/vocals.json"),
    ])

    const id = getParam("id")
    const p = producers.find(x => x.id === id)
    if (!p) {
      content.innerHTML = `<p>見つからなかった</p>`
      return
    }

    document.title = `${p.name} - VOCALOG`

    const links = p.links || {}
    const linkHtml = `
      <div class="links">
        ${links.youtube ? `<a class="link" target="_blank" rel="noopener" href="${links.youtube}">YouTube</a>` : ""}
        ${links.niconico ? `<a class="link" target="_blank" rel="noopener" href="${links.niconico}">ニコニコ</a>` : ""}
        ${links.spotify ? `<a class="link" target="_blank" rel="noopener" href="${links.spotify}">Spotify</a>` : ""}
        ${links.appleMusic ? `<a class="link" target="_blank" rel="noopener" href="${links.appleMusic}">Apple Music</a>` : ""}
        ${links.youtubeMusic ? `<a class="link" target="_blank" rel="noopener" href="${links.youtubeMusic}">YouTube Music</a>` : ""}
        ${links.x ? `<a class="link" target="_blank" rel="noopener" href="${links.x}">X</a>` : ""}
      </div>
    `

    content.innerHTML = `
      <h2 class="title">
        ${escapeHtml(p.name)}
        ${p.nameKana ? `<span class="reading">(${escapeHtml(p.nameKana)})</span>` : ""}
      </h2>
      ${p.activeYears ? `<p class="muted">活動：${escapeHtml(p.activeYears)}</p>` : ""}
      ${p.aliases?.length ? `<p class="muted">別名：${p.aliases.map(escapeHtml).join(" / ")}</p>` : ""}
      ${p.summary ? `<p>${escapeHtml(p.summary)}</p>` : ""}
      ${linkHtml}
    `

    const vMap = new Map(vocals.map(v => [v.id, v.name]))
    const allSongs = songs.filter(s => s.producerId === p.id)

    const repSongs = allSongs.filter(s => s.isRepresentative === true)
    const repItems = (repSongs.length ? repSongs : allSongs)
      .slice()
      .sort((a, b) => {
        const ao = a.representativeOrder ?? 9999
        const bo = b.representativeOrder ?? 9999
        if (repSongs.length && ao !== bo) return ao - bo

        const ar = a.released || ""
        const br = b.released || ""
        if (ar !== br) return br.localeCompare(ar)

        return (a.title || "").localeCompare(b.title || "", "ja")
      })

    if (songsNote) {
      songsNote.textContent = repSongs.length
        ? ""
        : "代表曲未設定のため、最新曲を表示中"
    }

    let repExpanded = false

    function renderRepSongs() {
      const visibleSongs = repExpanded
        ? repItems
        : repItems.slice(0, 2)

      songsBox.innerHTML = visibleSongs.length
        ? visibleSongs.map(s => renderSongCard(s, vMap, "repCard")).join("")
        : `<p class="muted">まだ曲データがない</p>`

      if (repItems.length > 2) {
        songsBox.insertAdjacentHTML("beforeend", `
          <button class="moreButton" type="button">
            ${repExpanded ? "閉じる" : "もっと見る"}
          </button>
        `)

        songsBox.querySelector(".moreButton").onclick = () => {
          repExpanded = !repExpanded
          renderRepSongs()
        }
      }
    }

    renderRepSongs()

    const popularSongs = allSongs.filter(s => s.isPopular === true)

    if (popularNote) {
      popularNote.textContent = popularSongs.length
        ? ""
        : "人気曲未設定のため、最新曲を表示中"
    }

    const popItems = (popularSongs.length ? popularSongs : allSongs)
      .slice()
      .sort((a, b) => {
        const aw = isThisWeek(a) ? 1 : 0
        const bw = isThisWeek(b) ? 1 : 0
        if (aw !== bw) return bw - aw

        const ar = a.released || ""
        const br = b.released || ""
        if (ar !== br) return br.localeCompare(ar)

        return (a.title || "").localeCompare(b.title || "", "ja")
      })

    if (popularBox) {
      let popExpanded = false

      function renderPopularSongs() {
        const visibleSongs = popExpanded
          ? popItems
          : popItems.slice(0, 2)

        popularBox.innerHTML = visibleSongs.length
          ? visibleSongs.map(s => renderSongCard(s, vMap, "popularCard")).join("")
          : `<p class="muted">まだ曲データがない</p>`

        if (popItems.length > 2) {
          popularBox.insertAdjacentHTML("beforeend", `
            <button class="moreButton" type="button">
              ${popExpanded ? "閉じる" : "もっと見る"}
            </button>
          `)

          popularBox.querySelector(".moreButton").onclick = () => {
            popExpanded = !popExpanded
            renderPopularSongs()
          }
        }
      }

      renderPopularSongs()
    }
  } catch (err) {
    content.innerHTML = `<p>読み込み失敗: ${escapeHtml(err.message)}</p>`
  }
}

main()
