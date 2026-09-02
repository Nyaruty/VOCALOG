import { escapeHtml, getParam, loadJson, headerHtml } from "./app.js"

document.getElementById("header").innerHTML = headerHtml("songs")
const content = document.getElementById("content")

function buildVocalNameToId(vocalsArr){
  const m = new Map()
  for(const v of vocalsArr){
    if(v && v.name) m.set(v.name, v.id)
  }
  return m
}
function resolveVocalIds(song, vocalsArr){
  if(song && Array.isArray(song.vocalIds) && song.vocalIds.length) return song.vocalIds
  const nameToId = resolveVocalIds._nameToId || (resolveVocalIds._nameToId = buildVocalNameToId(vocalsArr))
  const ids = []
  for(const t of (song.tags || [])){
    const id = nameToId.get(t)
    if(id && !ids.includes(id)) ids.push(id)
  }
  if(ids.length) return ids
  return song.vocalId ? [song.vocalId] : []
}
function vocalLinks(song, vocalsArr){
  const vMap = new Map(vocalsArr.map(v=>[v.id, v]))
  return resolveVocalIds(song, vocalsArr)
    .map(id => vMap.get(id))
    .filter(Boolean)
    .map(v => `<a class="link" href="./vocal.html?id=${encodeURIComponent(v.id)}">${escapeHtml(v.name)}</a>`)
    .join("・")
}


async function main(){
  try{
    const [songs, producers, vocals] = await Promise.all([
      loadJson("./data/songs.json"),
      loadJson("./data/producers.json"),
      loadJson("./data/vocals.json"),
    ])

    const id = getParam("id")
    const s = songs.find(x=>x.id === id)
    if(!s){ content.innerHTML = `<p>曲が見つからなかった</p>`; return }

    const p = producers.find(x=>x.id === s.producerId)

    document.title = `${s.title} - VOCALOG`

    const niconicoSmId = s.niconicoId ? ((String(s.niconicoId).match(/(sm\d+)/) || [])[1] || s.niconicoId) : null;

    content.innerHTML = `
      <div class="songTitleLine">
        <h2 class="title songTitle">
          <span class="songTitleText">${escapeHtml(s.title)}</span>
          ${s.titleKana ? `<span class="reading">(${escapeHtml(s.titleKana)})</span>` : ""}
        </h2>
      </div>
      <p class="muted">
        ${p ? `<a class="link" href="./producer.html?id=${encodeURIComponent(p.id)}">${escapeHtml(p.name)}</a>` : "不明"}
        /
        ${(vocalLinks(s, vocals) || "不明")}
      </p>

      ${s.released ? `<p class="muted dateLabel">公開：${escapeHtml(s.released)}</p>` : ""}
      ${s.summary ? `<p>${escapeHtml(s.summary)}</p>` : ""}

      <div class="links">
        ${s.youtubeId ? `<a class="link" target="_blank" rel="noopener" href="https://www.youtube.com/watch?v=${encodeURIComponent(s.youtubeId)}">YouTube</a>` : ""}
        ${niconicoSmId ? `<a class="link" target="_blank" rel="noopener" href="https://www.nicovideo.jp/watch/${encodeURIComponent(niconicoSmId)}">ニコニコ</a>` : ""}
        ${s.spotifyLink ? `<a class="link" target="_blank" rel="noopener" href="${s.spotifyLink}">Spotify</a>` : ""}
        ${s.appleMusicLink ? `<a class="link" target="_blank" rel="noopener" href="${s.appleMusicLink}">Apple Music</a>` : ""}
        ${s.youtubeMusicLink ? `<a class="link" target="_blank" rel="noopener" href="${s.youtubeMusicLink}">YouTube Music</a>` : ""}
        ${s.lyricsLink ? `<a class="link" target="_blank" rel="noopener" href="${s.lyricsLink}">歌詞</a>` : ""}
      </div>

      <div class="tags">${(s.tags||[]).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>

      ${s.youtubeId ? `
      <div style="margin-top:12px;">
        <div class="vocalog-facade" data-type="youtube" data-id="${encodeURIComponent(s.youtubeId)}" data-title="${escapeHtml(s.title)}">
          <img src="https://img.youtube.com/vi/${encodeURIComponent(s.youtubeId)}/hqdefault.jpg" alt="${escapeHtml(s.title)}" class="vocalog-thumb" />
          <button class="vocalog-play-btn" aria-label="再生"></button>
        </div>
      </div>` : ""}
      
      ${niconicoSmId ? `
      <div style="margin-top:12px;">
        <div class="vocalog-facade" data-type="niconico" data-id="${encodeURIComponent(niconicoSmId)}">
          <div class="vocalog-nico-placeholder">ニコニコ動画を再生</div>
          <button class="vocalog-play-btn" aria-label="再生"></button>
        </div>
      </div>` : ""}
    `

    document.querySelectorAll('.vocalog-facade').forEach(facade => {
      facade.addEventListener('click', () => {
        const type = facade.dataset.type
        const id = facade.dataset.id
        const title = facade.dataset.title || ""
        const iframe = document.createElement('iframe')

        if (type === 'youtube') {
          iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1`
          iframe.title = title
          iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        } else if (type === 'niconico') {
          iframe.src = `https://embed.nicovideo.jp/watch/${id}?jsapi=1`
          iframe.title = "niconico"
        }

        iframe.allowFullscreen = true
        iframe.style.width = "100%"
        iframe.style.height = "100%"
        iframe.style.border = "none"

        facade.parentNode.replaceChild(iframe, facade)
      })
    })

  }catch(err){
    content.innerHTML = `<p>読み込み失敗: ${escapeHtml(err.message)}</p>`
  }
}
main()
