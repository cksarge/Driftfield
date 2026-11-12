# Music for Driftfield

This folder is for **recorded music tracks**. It's empty on purpose for now.

Until real tracks are added and wired in, the game keeps using its built-in **procedural music** (`js/audio.js`), which is generated live and needs no files. Dropping files in here does nothing on its own. They need to be hooked up in `js/audio.js` first.

## What to look for

The game's music changes with the mood of the moment. The built-in music already has these seven moods, so the easiest plan is one track (or a few) per mood:

| Mood | When it plays | Feel to look for |
| --- | --- | --- |
| `happy` | Daytime on a sunny or calm day, the Perfect Island | Bright, cozy, light acoustic or chiptune-ish |
| `calm` | Normal daytime | Gentle, slow, relaxed farming music |
| `night` | Evenings and nights | Soft, sleepy, music-box or ambient |
| `uneasy` | Before the storm in the tutorial | Same cozy vibe but slightly off, minor key |
| `storm` | The storm cinematic and lightning storms | Tense, windy, low drums or drones |
| `quiet` | Waking up on the rock after the storm | Very sparse, hopeful, a few notes |
| `festival` | Festival days | Upbeat, playful, a bit celebratory |

You don't need all seven. Any mood without a track keeps the procedural music.

## File guidelines

- **Format:** `.mp3` or `.ogg` (both play in every modern browser). `.mp3` is the safest single choice.
- **Names:** name files after the mood, like `calm.mp3`, `night.mp3`, `festival.mp3`. For more than one track per mood, number them: `calm-1.mp3`, `calm-2.mp3`.
- **Loops:** tracks that loop cleanly sound best, since a farming day lasts a while. 1–4 minutes per track is plenty.
- **Size:** keep each file under about 5 MB (128–160 kbps mp3 is fine). Every file is cached for offline play, so big files make the first load slower.
- **Volume:** quiet, background-level tracks are better than loud mastered ones. Avoid tracks with vocals.

## Licensing (important)

Only use music you're allowed to put in a public GitHub repo **and** a public website:

- ✅ **CC0 / public domain**: no strings attached.
- ✅ **CC BY**: fine, but you must credit the artist (that's what `credits.txt` is for).
- ⚠️ **CC BY-SA**: allowed, but the track itself stays under BY-SA. Fine for a music file, just credit it.
- ❌ **CC BY-NC** (non-commercial) is risky if you ever add ads or donations.
- ❌ **"Free to listen" YouTube music, game rips, or anything without a clear license**: don't use.

Good places to look: OpenGameArt.org (filter by CC0 / CC BY), FreePD.com, Incompetech (Kevin MacLeod, CC BY), Pixabay Music, and the Free Music Archive.

**Fill in `credits.txt` for every track you add**, right when you download it. It's much harder to find the source later.

## When you have them

Drop the files in this folder, fill in `credits.txt`, and ask Claude (or edit `js/audio.js`) to play the files for each mood, falling back to the procedural music for any mood without a file. After that, run `node tools/build-sw.mjs` so the tracks are cached for offline play.
