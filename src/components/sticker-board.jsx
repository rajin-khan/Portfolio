import { useEffect, useMemo, useRef, useState } from "react";
import stickers from "../data/stickers.json";

const LOCAL_STORAGE_KEY = "rajin-sticker-board-placements-v5";
const LEGACY_LOCAL_STORAGE_KEYS = [
  "rajin-sticker-board-placements-v4",
  "rajin-sticker-board-placements-v3",
  "rajin-sticker-board-placements-v2",
  "rajin-sticker-board-placements-v1",
];
const MESSAGE_LIMIT = 180;
const NAME_LIMIT = 32;
const BOARD_ROWS = 3;
const ROW_GROUP_SIZE = 4;
const GROUP_SIZE = BOARD_ROWS * ROW_GROUP_SIZE;
const MAX_PLACEMENTS = 240;
const MAX_GROUPS = Math.ceil(MAX_PLACEMENTS / GROUP_SIZE);
const MIN_RENDER_GROUPS = 2;
const NOTE_DOODLES = [
  "/assets/images/stickers/doodles/doodle-1.png",
  "/assets/images/stickers/doodles/doodle-2.webp",
  "/assets/images/stickers/doodles/doodle-3.webp",
];
const NOTE_DOODLE_VARIANTS = [
  { x: "7.4%", y: "7.2%", rotate: "-7deg", scale: "0.92", opacity: "0.62" },
  { x: "8.6%", y: "8%", rotate: "4deg", scale: "0.84", opacity: "0.56" },
  { x: "6.8%", y: "8.8%", rotate: "-2deg", scale: "0.98", opacity: "0.58" },
];

const SHAPE_CONFIG = {
  portrait: {
    label: "portrait",
    aspect: 0.72,
    boardInline: "clamp(6rem, 10.2cqw, 8.7rem)",
    selectedInline: "clamp(10.6rem, 18.2cqw, 14.8rem)",
    modalInline: "min(24rem, 74vw)",
    actionX: "clamp(4.35rem, 6.5vw, 5.35rem)",
    actionY: "clamp(6rem, 9vw, 7.1rem)",
    rowTone: "232 226 214",
  },
  square: {
    label: "square",
    aspect: 1,
    boardInline: "clamp(6.5rem, 11.4cqw, 9.7rem)",
    selectedInline: "clamp(11.2rem, 19.2cqw, 15.6rem)",
    modalInline: "min(26rem, 78vw)",
    actionX: "clamp(5rem, 7.4vw, 6.1rem)",
    actionY: "clamp(5rem, 7.4vw, 6.1rem)",
    rowTone: "226 228 232",
  },
  landscape: {
    label: "wide",
    aspect: 1.62,
    boardInline: "clamp(7.4rem, 14.7cqw, 12.6rem)",
    selectedInline: "clamp(12.8rem, 23cqw, 18.8rem)",
    modalInline: "min(34rem, 88vw)",
    actionX: "clamp(6.2rem, 9.6vw, 7.7rem)",
    actionY: "clamp(3.55rem, 5.45vw, 4.55rem)",
    rowTone: "222 226 224",
  },
};

const MAX_STICKER_WIDTH = Math.max(...stickers.map((sticker) => sticker.width || 1));
const MAX_STICKER_HEIGHT = Math.max(...stickers.map((sticker) => sticker.height || 1));
const MAX_STICKER_LONG_SIDE = Math.max(
  ...stickers.map((sticker) => Math.max(sticker.width || 1, sticker.height || 1)),
);
const SLOT_VARIANTS = [
  { x: "1%", y: "-1%", rotate: "-2.4deg", scale: "1.04" },
  { x: "2%", y: "1%", rotate: "1.8deg", scale: "1.03" },
  { x: "-1%", y: "-3%", rotate: "-1.4deg", scale: "1.08" },
  { x: "4%", y: "2%", rotate: "3.7deg", scale: "0.98" },
  { x: "-2%", y: "-1%", rotate: "-2.1deg", scale: "1.02" },
  { x: "3%", y: "0%", rotate: "2.4deg", scale: "1.1" },
  { x: "-3%", y: "2%", rotate: "-3.4deg", scale: "1.05" },
  { x: "0%", y: "-2%", rotate: "4.4deg", scale: "1.12" },
  { x: "2%", y: "2%", rotate: "-1deg", scale: "1.04" },
  { x: "-4%", y: "1%", rotate: "2.8deg", scale: "1.08" },
  { x: "1%", y: "-1%", rotate: "-4deg", scale: "1.06" },
  { x: "-2%", y: "2%", rotate: "1.5deg", scale: "1.13" },
  { x: "3%", y: "-3%", rotate: "-2.8deg", scale: "1" },
  { x: "-1%", y: "0%", rotate: "3.2deg", scale: "1.07" },
  { x: "2%", y: "1%", rotate: "-1.8deg", scale: "1.04" },
];
const NOTE_LEET_MAP = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  "$": "s",
  "!": "i",
};
const BLOCKED_NOTE_PATTERNS = [
  /\b(?:fuck|fucker|fucking|motherfucker|mf)\b/,
  /\b(?:shit|bullshit|shitty)\b/,
  /\b(?:bitch|asshole|bastard|cunt|dick|pussy|whore|slut|douchebag|wanker)\b/,
  /\b(?:nigger|nigga|niggah|niggers|niggas)\b/,
  /\b(?:fag|faggot)\b/,
  /\b(?:retard|retarded)\b/,
  /\b(?:kike|chink|spic|tranny|coon)\b/,
  /\b(?:madarchod|bhenchod|behnchod|bokachoda|choda|chodna)\b/,
];
const BLOCKED_NOTE_COMPACT_PATTERNS = [
  /f+u+c+k+/,
  /s+h+i+t+/,
  /b+i+t+c+h+/,
  /a+s+s+h+o+l+e+/,
  /c+u+n+t+/,
  /n+i+g+g+(?:a|er|ah)?/,
  /f+a+g+(?:g+o+t+)?/,
  /r+e+t+a+r+d+/,
  /m+a+d+a+r+c+h+o+d+/,
  /b+h?e+h?n+c+h+o+d+/,
  /b+o+k+a+c+h+o+d+/,
];
const tiltFrameByElement = new WeakMap();
const lastPointerByElement = new WeakMap();

function getLocalPlacements() {
  if (typeof window === "undefined") return [];

  try {
    const raw =
      window.localStorage.getItem(LOCAL_STORAGE_KEY) ||
      LEGACY_LOCAL_STORAGE_KEYS.map((key) => window.localStorage.getItem(key)).find(Boolean);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setLocalPlacements(placements) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(placements));
}

function findSticker(stickerId) {
  return stickers.find((sticker) => sticker.id === stickerId) || stickers[0];
}

function stickerKind(sticker) {
  const aspect = Number(sticker?.aspectRatio) || 1;
  if (aspect < 0.86) return "portrait";
  if (aspect > 1.18) return "landscape";
  return "square";
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function stickerStyle(sticker) {
  const kind = stickerKind(sticker);
  const aspect = clamp(Number(sticker?.aspectRatio) || SHAPE_CONFIG[kind].aspect, 0.5, 2.6);
  const longestSide = Math.max(sticker?.width || 1, sticker?.height || 1);
  const widthWeight = (sticker?.width || 1) / MAX_STICKER_WIDTH;
  const heightWeight = (sticker?.height || 1) / MAX_STICKER_HEIGHT;
  const longSideWeight = longestSide / MAX_STICKER_LONG_SIDE;
  const presence = clamp(Math.max(widthWeight, heightWeight, longSideWeight), 0.82, 1.08);

  return {
    "--sticker-aspect": aspect.toFixed(3),
    "--sticker-presence": presence.toFixed(3),
    "--sticker-board-inline": SHAPE_CONFIG[kind].boardInline,
    "--sticker-selected-inline": SHAPE_CONFIG[kind].selectedInline,
    "--sticker-action-x": SHAPE_CONFIG[kind].actionX,
    "--sticker-action-y": SHAPE_CONFIG[kind].actionY,
    "--row-tone": SHAPE_CONFIG[kind].rowTone,
  };
}

function flipFrameFor(sticker) {
  const rawAspect = Number(sticker?.aspectRatio) || 1;
  const aspect = clamp(rawAspect, 0.5, 2.6);
  const kind = stickerKind(sticker);

  return {
    "--flip-inline": SHAPE_CONFIG[kind].modalInline,
    "--flip-aspect": aspect.toFixed(3),
  };
}

function formatStickerDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);

  return `${day}.${month}.${year}`;
}

function hashString(value) {
  return String(value || "").split("").reduce((hash, character) => {
    return (hash * 31 + character.charCodeAt(0)) >>> 0;
  }, 2166136261);
}

function noteDoodleFor(placement, sticker) {
  const key = placement?.id || `${sticker?.id || "preview"}-${sticker?.src || ""}`;
  const hash = hashString(key);
  const variant = NOTE_DOODLE_VARIANTS[hash % NOTE_DOODLE_VARIANTS.length];

  return {
    src: NOTE_DOODLES[hash % NOTE_DOODLES.length],
    style: {
      "--note-doodle-x": variant.x,
      "--note-doodle-y": variant.y,
      "--note-doodle-rotate": variant.rotate,
      "--note-doodle-scale": variant.scale,
      "--note-doodle-opacity": variant.opacity,
    },
  };
}

function normalizePlacement(placement) {
  const sticker = findSticker(placement.stickerId);
  const slotId = Number.isInteger(placement.slotId) && placement.slotId >= 0 ? placement.slotId : 0;

  return {
    id: placement.id || `${placement.stickerId}-${slotId}-${Date.now()}`,
    stickerId: placement.stickerId,
    stickerSrc: sticker.src,
    message: placement.message || "",
    authorName: String(placement.authorName || "").slice(0, NAME_LIMIT),
    slotId,
    createdAt: placement.createdAt || new Date().toISOString(),
    pending: Boolean(placement.pending),
  };
}

function slotGroup(slotId) {
  return Math.floor(slotId / GROUP_SIZE);
}

function slotRow(slotId) {
  return Math.floor((slotId % GROUP_SIZE) / ROW_GROUP_SIZE);
}

function slotColumn(slotId) {
  return slotId % ROW_GROUP_SIZE;
}

function slotIdFor(row, group, column) {
  return group * GROUP_SIZE + row * ROW_GROUP_SIZE + column;
}

function placementsBySlot(placements) {
  return new Map(placements.map((placement) => [placement.slotId, normalizePlacement(placement)]));
}

function rowGroupPlacements(placements, row, group) {
  return placements
    .filter((placement) => slotGroup(placement.slotId) === group && slotRow(placement.slotId) === row)
    .sort((a, b) => slotColumn(a.slotId) - slotColumn(b.slotId));
}

function rowGroupKind(placements, row, group) {
  const firstPlacement = rowGroupPlacements(placements, row, group)[0];
  if (!firstPlacement) return null;
  return stickerKind(findSticker(firstPlacement.stickerId));
}

function firstOpenInRowGroup(placements, row, group) {
  const occupiedSlots = new Set(placements.map((placement) => placement.slotId));

  for (let column = 0; column < ROW_GROUP_SIZE; column += 1) {
    const slotId = slotIdFor(row, group, column);
    if (slotId < MAX_PLACEMENTS && !occupiedSlots.has(slotId)) return slotId;
  }

  return undefined;
}

function nextRequiredKind(placements) {
  for (let group = 0; group < MAX_GROUPS; group += 1) {
    for (let row = 0; row < BOARD_ROWS; row += 1) {
      const kind = rowGroupKind(placements, row, group);
      if (kind && firstOpenInRowGroup(placements, row, group) !== undefined) return kind;
    }
  }

  return null;
}

function findPlacementSlot(placements, sticker) {
  const kind = stickerKind(sticker);

  for (let group = 0; group < MAX_GROUPS; group += 1) {
    for (let row = 0; row < BOARD_ROWS; row += 1) {
      if (rowGroupKind(placements, row, group) !== kind) continue;
      const slotId = firstOpenInRowGroup(placements, row, group);
      if (slotId !== undefined) return slotId;
    }
  }

  for (let group = 0; group < MAX_GROUPS; group += 1) {
    for (let row = 0; row < BOARD_ROWS; row += 1) {
      if (rowGroupPlacements(placements, row, group).length > 0) continue;
      const slotId = firstOpenInRowGroup(placements, row, group);
      if (slotId !== undefined) return slotId;
    }
  }

  return undefined;
}

function renderGroupCount(placements) {
  const highestGroup = placements.reduce((max, placement) => Math.max(max, slotGroup(placement.slotId)), -1);
  return clamp(highestGroup + 2, MIN_RENDER_GROUPS, MAX_GROUPS);
}

function boardRows(placements) {
  const bySlot = placementsBySlot(placements);
  const groupCount = renderGroupCount(placements);

  return Array.from({ length: BOARD_ROWS }, (_row, row) => {
    return Array.from({ length: groupCount }, (_group, group) => {
      const kind = rowGroupKind(placements, row, group);
      const tone = kind ? SHAPE_CONFIG[kind].rowTone : "226 226 226";

      return {
        row,
        group,
        kind,
        tone,
        slots: Array.from({ length: ROW_GROUP_SIZE }, (_slot, column) => {
          const slotId = slotIdFor(row, group, column);
          return {
            id: slotId,
            index: row * ROW_GROUP_SIZE + column,
            placement: bySlot.get(slotId) || null,
            variant: SLOT_VARIANTS[(group * GROUP_SIZE + row * ROW_GROUP_SIZE + column) % SLOT_VARIANTS.length],
          };
        }),
      };
    });
  });
}

function chooseSticker(placements, preferredSticker = null) {
  const usedIds = new Set(placements.map((item) => item.stickerId));
  const available = stickers.filter((sticker) => !usedIds.has(sticker.id));
  const requiredKind = nextRequiredKind(placements);
  const matching = requiredKind
    ? available.filter((sticker) => stickerKind(sticker) === requiredKind)
    : [];
  const pool = matching.length > 0 ? matching : available.length > 0 ? available : stickers;

  if (preferredSticker && pool.some((sticker) => sticker.id === preferredSticker.id)) {
    return preferredSticker;
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

function isSlotOpen(placements, slotId) {
  if (!Number.isInteger(slotId) || slotId < 0) return false;
  if (slotId >= MAX_PLACEMENTS) return false;
  if (placements.some((placement) => placement.slotId === slotId)) return false;
  return true;
}

function setPointerTilt(event) {
  if (event.pointerType === "touch") return;
  const target = event.currentTarget;

  lastPointerByElement.set(target, {
    clientX: event.clientX,
    clientY: event.clientY,
  });

  if (tiltFrameByElement.has(target)) return;

  const frame = window.requestAnimationFrame(() => {
    const pointer = lastPointerByElement.get(target);
    if (!pointer) {
      tiltFrameByElement.delete(target);
      return;
    }

    const rect = target.getBoundingClientRect();
    const x = (pointer.clientX - rect.left) / rect.width - 0.5;
    const y = (pointer.clientY - rect.top) / rect.height - 0.5;

    target.style.setProperty("--tilt-x", `${(-y * 13).toFixed(2)}deg`);
    target.style.setProperty("--tilt-y", `${(x * 15).toFixed(2)}deg`);
    tiltFrameByElement.delete(target);
  });

  tiltFrameByElement.set(target, frame);
}

function clearPointerTilt(event) {
  const target = event.currentTarget;
  const frame = tiltFrameByElement.get(target);

  if (frame) {
    window.cancelAnimationFrame(frame);
    tiltFrameByElement.delete(target);
  }

  lastPointerByElement.delete(target);
  target.style.removeProperty("--tilt-x");
  target.style.removeProperty("--tilt-y");
}

function normalizeNoteForFilter(text) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[013457@$!]/g, (character) => NOTE_LEET_MAP[character] || character)
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function noteHasBlockedLanguage(text) {
  const normalized = normalizeNoteForFilter(text);
  const compact = normalized.replace(/\s+/g, "");

  return (
    BLOCKED_NOTE_PATTERNS.some((pattern) => pattern.test(normalized)) ||
    BLOCKED_NOTE_COMPACT_PATTERNS.some((pattern) => pattern.test(compact))
  );
}

function validateNote(text) {
  const note = text.trim();

  if (!note) return "Write a note first.";
  if (noteHasBlockedLanguage(note)) return "Please keep the note kind.";
  return "";
}

function validateName(text) {
  const name = text.trim();

  if (!name) return "";
  if (noteHasBlockedLanguage(name)) return "Please keep the name kind.";
  return "";
}

export default function StickerBoard() {
  const pendingRequestRef = useRef(0);
  const noteInputRef = useRef(null);

  const [placements, setPlacements] = useState([]);
  const [selectedSticker, setSelectedSticker] = useState(null);
  const [message, setMessage] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [, setStatus] = useState("loading");
  const [modalPlacement, setModalPlacement] = useState(null);
  const [previewSticker, setPreviewSticker] = useState(null);
  const [modalFlipped, setModalFlipped] = useState(false);
  const [noteError, setNoteError] = useState("");
  const [newPlacementSlotId, setNewPlacementSlotId] = useState(null);
  const [composerStickerDeparting, setComposerStickerDeparting] = useState(false);
  const [composerStickerReturning, setComposerStickerReturning] = useState(false);
  const [departingPlacementId, setDepartingPlacementId] = useState(null);
  const [returningPlacementId, setReturningPlacementId] = useState(null);
  const [modalEntryKind, setModalEntryKind] = useState("default");
  const [modalClosing, setModalClosing] = useState(false);

  const rows = useMemo(() => boardRows(placements), [placements]);
  const availableStickers = useMemo(() => {
    const usedIds = new Set(placements.map((item) => item.stickerId));
    return stickers.filter((sticker) => !usedIds.has(sticker.id));
  }, [placements]);
  const allStickersUsed = availableStickers.length === 0;
  const modalSticker = modalPlacement ? findSticker(modalPlacement.stickerId) : previewSticker;
  const modalFrame = modalSticker ? flipFrameFor(modalSticker) : null;
  const modalMessage =
    modalPlacement?.message ||
    (previewSticker ? message.trim() || "Write something small for the sticker to carry." : "");
  const modalAuthorName = modalPlacement?.authorName || "";
  const modalTimestamp = modalPlacement ? formatStickerDate(modalPlacement.createdAt) : "";
  const modalDoodle = modalSticker ? noteDoodleFor(modalPlacement, modalSticker) : null;
  const noteCharactersLeft = MESSAGE_LIMIT - message.length;
  const showNoteLimitWarning = Boolean(previewSticker && noteCharactersLeft <= 15);
  const noteDensityClass = message.length > 125 ? "is-dense" : message.length > 75 ? "is-compact" : "";

  useEffect(() => {
    let isMounted = true;

    async function loadPlacements() {
      try {
        const response = await fetch("/api/stickers");
        if (!response.ok) throw new Error("Sticker API unavailable");
        const data = await response.json();
        if (data.storage === "unavailable") throw new Error("Sticker API storage unavailable");

        const nextPlacements = Array.isArray(data.placements)
          ? data.placements.map(normalizePlacement)
          : [];

        if (!isMounted) return;
        setPlacements(nextPlacements);
        setLocalPlacements(nextPlacements);
        setSelectedSticker((currentSticker) => chooseSticker(nextPlacements, currentSticker));
        setStatus("ready");
      } catch {
        const localPlacements = getLocalPlacements().map(normalizePlacement);
        if (!isMounted) return;
        setPlacements(localPlacements);
        setSelectedSticker((currentSticker) => chooseSticker(localPlacements, currentSticker));
        setStatus("local");
      }
    }

    loadPlacements();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (newPlacementSlotId === null) return;
    const timeout = window.setTimeout(() => setNewPlacementSlotId(null), 860);
    return () => window.clearTimeout(timeout);
  }, [newPlacementSlotId]);

  useEffect(() => {
    if ((!modalPlacement && !previewSticker) || modalClosing) return;

    setModalFlipped(false);

    if (!previewSticker) return;

    const flipTimeout = window.setTimeout(() => {
      setModalFlipped(true);
    }, 1000);
    const focusTimeout = window.setTimeout(() => {
      noteInputRef.current?.focus();
    }, 1120);

    return () => {
      window.clearTimeout(flipTimeout);
      window.clearTimeout(focusTimeout);
    };
  }, [modalPlacement, previewSticker, modalClosing]);

  useEffect(() => {
    if (!modalPlacement && !previewSticker) return;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        closeStickerModal();
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [modalPlacement, previewSticker]);

  useEffect(() => {
    const input = noteInputRef.current;
    if (!input || !previewSticker) return;

    input.style.height = "0px";
    input.style.height = `${input.scrollHeight}px`;
  }, [message, previewSticker, modalFlipped]);

  async function persistPlacement(placement, optimisticPlacements) {
    const requestId = ++pendingRequestRef.current;

    try {
      const response = await fetch("/api/stickers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stickerId: placement.stickerId,
          message: placement.message,
          authorName: placement.authorName || "",
          slotId: placement.slotId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (
          requestId === pendingRequestRef.current &&
          (
            data?.error === "Write a note first." ||
            data?.error === "Please keep the note kind." ||
            data?.error === "Please keep the name kind."
          )
        ) {
          const rolledBackPlacements = optimisticPlacements.filter((item) => item.id !== placement.id);
          const rejectedSticker = findSticker(placement.stickerId);

          setPlacements(rolledBackPlacements);
          setLocalPlacements(rolledBackPlacements);
          setSelectedSticker(rejectedSticker);
          setMessage(placement.message);
          setAuthorName(placement.authorName || "");
          setPreviewSticker(rejectedSticker);
          setNoteError(data.error);
          setModalFlipped(true);
          setStatus("local");
          return;
        }

        if (Array.isArray(data.placements) && requestId === pendingRequestRef.current) {
          const serverPlacements = data.placements.map(normalizePlacement);
          setPlacements(serverPlacements);
          setLocalPlacements(serverPlacements);
          setSelectedSticker((currentSticker) => chooseSticker(serverPlacements, currentSticker));
          setStatus("ready");
        } else if (requestId === pendingRequestRef.current) {
          const settledPlacements = optimisticPlacements.map((item) =>
            item.id === placement.id ? { ...item, pending: false } : item,
          );
          setPlacements(settledPlacements);
          setLocalPlacements(settledPlacements);
          setSelectedSticker((currentSticker) => chooseSticker(settledPlacements, currentSticker));
          setStatus("local");
        }
        return;
      }

      if (requestId !== pendingRequestRef.current) return;

      const serverPlacements = Array.isArray(data.placements)
        ? data.placements.map(normalizePlacement)
        : optimisticPlacements.map((item) =>
            item.id === placement.id ? normalizePlacement(data.placement || placement) : item,
          );

      setPlacements(serverPlacements);
      setLocalPlacements(serverPlacements);
      setSelectedSticker((currentSticker) => chooseSticker(serverPlacements, currentSticker));
      setStatus("saved");
    } catch {
      if (requestId !== pendingRequestRef.current) return;
      const settledPlacements = optimisticPlacements.map((item) =>
        item.id === placement.id ? { ...item, pending: false } : item,
      );
      setPlacements(settledPlacements);
      setLocalPlacements(settledPlacements);
      setSelectedSticker((currentSticker) => chooseSticker(settledPlacements, currentSticker));
      setStatus("local");
    }
  }

  function updateMessage(value) {
    setMessage(value);
    if (noteError) setNoteError("");
  }

  function updateAuthorName(value) {
    setAuthorName(value.slice(0, NAME_LIMIT));
    if (noteError) setNoteError("");
  }

  function openSelectedStickerNote() {
    if (
      !selectedSticker ||
      allStickersUsed ||
      composerStickerDeparting ||
      composerStickerReturning ||
      departingPlacementId ||
      returningPlacementId ||
      modalClosing
    ) {
      return;
    }
    setNoteError("");
    setAuthorName("");
    setModalClosing(false);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setModalEntryKind("from-composer");
      setPreviewSticker(selectedSticker);
      return;
    }

    setComposerStickerDeparting(true);
  }

  function openPlacedStickerNote(placement) {
    if (
      composerStickerDeparting ||
      composerStickerReturning ||
      departingPlacementId ||
      returningPlacementId ||
      modalClosing
    ) {
      return;
    }
    setAuthorName("");
    setModalClosing(false);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setModalEntryKind("from-board");
      setModalPlacement(placement);
      return;
    }

    setDepartingPlacementId(placement.id);
  }

  function closeStickerModal() {
    if (modalClosing || (!modalPlacement && !previewSticker)) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      setModalPlacement(null);
      setPreviewSticker(null);
      setComposerStickerDeparting(false);
      setComposerStickerReturning(false);
      setDepartingPlacementId(null);
      setReturningPlacementId(null);
      setModalClosing(false);
      setModalEntryKind("default");
      setAuthorName("");
      setNoteError("");
      return;
    }

    setModalClosing(true);
  }

  function handleSelectedStickerJourneyEnd(event) {
    if (event.target !== event.currentTarget) return;

    if (composerStickerReturning && event.animationName === "selected-sticker-return-right") {
      setComposerStickerReturning(false);
      setModalEntryKind("default");
      return;
    }

    if (
      composerStickerDeparting &&
      !previewSticker &&
      event.animationName === "selected-sticker-depart-right"
    ) {
      setModalEntryKind("from-composer");
      setPreviewSticker(selectedSticker);
    }
  }

  function handlePlacedStickerJourneyEnd(event, placement) {
    if (returningPlacementId === placement.id && event.animationName === "placed-sticker-return") {
      setReturningPlacementId(null);
      setModalEntryKind("default");
      return;
    }

    if (
      departingPlacementId === placement.id &&
      !modalPlacement &&
      event.animationName === "placed-sticker-depart"
    ) {
      setModalEntryKind("from-board");
      setModalPlacement(placement);
    }
  }

  function handleModalJourneyEnd(event) {
    if (event.target !== event.currentTarget || !modalClosing) return;
    if (
      event.animationName !== "sticker-modal-leave-to-bottom" &&
      event.animationName !== "sticker-modal-leave-to-board"
    ) {
      return;
    }

    const returningId = modalPlacement?.id || null;
    const returningToComposer = modalEntryKind === "from-composer";

    setModalPlacement(null);
    setPreviewSticker(null);
    setModalClosing(false);
    setAuthorName("");
    setNoteError("");

    if (returningToComposer) {
      setComposerStickerDeparting(false);
      setComposerStickerReturning(true);
      return;
    }

    setDepartingPlacementId(null);
    setReturningPlacementId(returningId);
  }

  function placeSticker() {
    const stickerForPlacement = previewSticker || selectedSticker;
    const slotId = stickerForPlacement ? findPlacementSlot(placements, stickerForPlacement) : undefined;

    if (
      !stickerForPlacement ||
      allStickersUsed ||
      slotId === undefined ||
      !isSlotOpen(placements, slotId) ||
      placements.some((placement) => placement.stickerId === stickerForPlacement.id)
    ) {
      return;
    }

    const noteText = (noteInputRef.current?.value ?? message).trim();
    const trimmedAuthorName = authorName.trim();
    const validationError = validateNote(noteText) || validateName(trimmedAuthorName);

    if (validationError) {
      setNoteError(validationError);
      setModalFlipped(true);
      window.setTimeout(() => noteInputRef.current?.focus(), 0);
      return;
    }

    const optimisticPlacement = normalizePlacement({
      id: `local-${crypto.randomUUID()}`,
      stickerId: stickerForPlacement.id,
      stickerSrc: stickerForPlacement.src,
      message: noteText,
      authorName: trimmedAuthorName,
      slotId,
      createdAt: new Date().toISOString(),
      pending: true,
    });
    const optimisticPlacements = [...placements, optimisticPlacement];

    setPlacements(optimisticPlacements);
    setLocalPlacements(optimisticPlacements);
    setMessage("");
    setAuthorName("");
    setNoteError("");
    setPreviewSticker(null);
    setComposerStickerDeparting(false);
    setComposerStickerReturning(false);
    setDepartingPlacementId(null);
    setReturningPlacementId(null);
    setModalClosing(false);
    setModalEntryKind("default");
    setSelectedSticker((currentSticker) => chooseSticker(optimisticPlacements, currentSticker));
    setNewPlacementSlotId(optimisticPlacement.slotId);
    setStatus("saving");

    persistPlacement(optimisticPlacement, optimisticPlacements);
  }

  return (
    <section id="sticker-board" className="sticker-board-section" aria-labelledby="sticker-board-title">
      <div className="sticker-board-heading">
        <h2 id="sticker-board-title">Guestbook</h2>
        <p>A little board where you can leave a piece of yourself. It stays forever! 🤍</p>
      </div>

      <div className="sticker-board-shell">
        <div className="sticker-board-panel" aria-label="Visitor sticker board">
          <div className="sticker-board-surface">
            <div className="sticker-board-track">
              {rows.map((rowGroups, rowIndex) => (
                <div className="sticker-board-row" key={rowIndex}>
                  {rowGroups.map((group) => (
                    <div
                      className={`sticker-row-group ${group.kind ? `is-${group.kind}` : "is-empty"}`}
                      key={`${group.row}-${group.group}`}
                      style={{ "--row-tone": group.tone }}
                    >
                      {group.slots.map((slot) => {
                        const placement = slot.placement;
                        const sticker = placement ? findSticker(placement.stickerId) : null;

                        return (
                          <div
                            className={`sticker-slot ${placement ? "has-sticker" : ""}`}
                            data-sticker-slot={slot.id}
                            key={slot.id}
                            style={{
                              "--slot-rotation": slot.variant.rotate,
                              "--slot-x": slot.variant.x,
                              "--slot-y": slot.variant.y,
                              "--slot-scale": slot.variant.scale,
                              "--slot-edge-x":
                                slotColumn(slot.id) === 0
                                  ? "clamp(0.38rem, 0.9vw, 0.72rem)"
                                  : slotColumn(slot.id) === ROW_GROUP_SIZE - 1
                                    ? "clamp(-0.72rem, -0.9vw, -0.38rem)"
                                    : "0px",
                            }}
                          >
                            <span className="empty-sticker-slot" aria-hidden="true" />
                            {placement ? (
                              <button
                                type="button"
                                className={`placed-sticker ${placement.pending ? "is-pending" : ""} ${
                                  newPlacementSlotId === placement.slotId ? "is-new" : ""
                                } ${departingPlacementId === placement.id ? "is-departing-to-focus" : ""} ${
                                  returningPlacementId === placement.id ? "is-returning-from-focus" : ""
                                }`}
                                onClick={() => openPlacedStickerNote(placement)}
                                onAnimationEnd={(event) => handlePlacedStickerJourneyEnd(event, placement)}
                                onPointerMove={setPointerTilt}
                                onPointerLeave={clearPointerTilt}
                                style={stickerStyle(sticker)}
                                aria-label="Open sticker note"
                              >
                                <span className="placed-sticker-shape">
                                  <img
                                    src={placement.stickerSrc}
                                    width={sticker?.width}
                                    height={sticker?.height}
                                    alt=""
                                    loading="lazy"
                                  />
                                </span>
                              </button>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="sticker-composer" aria-label="Sticker composer">
          <div className="selected-sticker-card">
            <div className="selected-sticker-stage">
              <div
                className={`selected-sticker ${!selectedSticker || allStickersUsed ? "is-disabled" : ""} ${
                  composerStickerDeparting ? "is-departing-right" : ""
                } ${composerStickerReturning ? "is-returning-from-right" : ""}`}
                onAnimationEnd={handleSelectedStickerJourneyEnd}
                onClick={(event) => {
                  if (event.target instanceof HTMLElement && event.target.closest("button")) return;
                  openSelectedStickerNote();
                }}
                onPointerMove={setPointerTilt}
                onPointerLeave={clearPointerTilt}
                style={selectedSticker ? stickerStyle(selectedSticker) : undefined}
              >
                {selectedSticker ? (
                  <span className="selected-sticker-float">
                    <span className="selected-sticker-callout">here&apos;s your sticker.</span>
                    <button
                      type="button"
                      className="selected-sticker-main"
                      onClick={openSelectedStickerNote}
                      aria-label="Open selected sticker note"
                      disabled={allStickersUsed}
                    >
                      <img
                        className="selected-sticker-image"
                        src={selectedSticker.src}
                        width={selectedSticker.width}
                        height={selectedSticker.height}
                        alt=""
                        draggable="false"
                      />
                    </button>
                    <button
                      type="button"
                      className="sticker-pencil-action"
                      onClick={openSelectedStickerNote}
                      aria-label="Write a note for this sticker"
                      disabled={allStickersUsed}
                    >
                      <img
                        src="/assets/images/writing-tool.png"
                        width="24"
                        height="24"
                        alt=""
                        draggable="false"
                      />
                    </button>
                  </span>
                ) : (
                  <span className="selected-sticker-loading" />
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {modalSticker ? (
        <div
          className={`sticker-modal ${modalClosing ? "is-closing" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label="Sticker note"
        >
          <button
            type="button"
            className="sticker-modal-backdrop"
            aria-label="Close sticker note"
            onClick={closeStickerModal}
          />
          <div
            className={`sticker-modal-card ${previewSticker ? "is-writing" : ""} ${
              modalClosing
                ? modalEntryKind === "from-composer"
                  ? "is-leaving-to-bottom"
                  : "is-leaving-to-board"
                : modalEntryKind === "from-composer"
                  ? "is-arriving-from-bottom"
                  : modalEntryKind === "from-board"
                    ? "is-arriving-from-board"
                    : ""
            }`}
            style={modalFrame || undefined}
            onAnimationEnd={handleModalJourneyEnd}
          >
            <div className="sticker-modal-frame">
              <button
                type="button"
                className="sticker-modal-close"
                aria-label="Close sticker note"
                onClick={closeStickerModal}
              >
                ×
              </button>
              <div
                role="button"
                tabIndex={0}
                className={`sticker-flip-object ${modalFlipped ? "is-flipped" : ""}`}
                onClick={(event) => {
                  if (event.target instanceof HTMLElement && event.target.closest(".sticker-note-editor")) return;
                  setModalFlipped((value) => !value);
                }}
                onKeyDown={(event) => {
                  if (event.target instanceof HTMLElement && event.target.closest(".sticker-note-editor")) return;
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setModalFlipped((value) => !value);
                  }
                }}
                aria-label="Flip sticker note"
              >
                <span className="sticker-flip-face sticker-flip-front">
                  <img src={modalPlacement?.stickerSrc || previewSticker?.src} alt="" />
                </span>
                <span className="sticker-flip-face sticker-flip-back">
                  {modalDoodle ? (
                    <img
                      className="sticker-note-doodle"
                      src={modalDoodle.src}
                      alt=""
                      aria-hidden="true"
                      style={modalDoodle.style}
                    />
                  ) : null}
                  {previewSticker ? (
                    <span className={`sticker-note-editor ${noteDensityClass}`}>
                      <textarea
                        ref={noteInputRef}
                        className="sticker-note-input"
                        value={message}
                        rows={1}
                        maxLength={MESSAGE_LIMIT}
                        onInput={(event) => updateMessage(event.currentTarget.value)}
                        onChange={(event) => updateMessage(event.target.value)}
                        placeholder="write something tiny"
                        aria-label="Sticker note"
                        aria-invalid={Boolean(noteError)}
                        aria-describedby={showNoteLimitWarning ? "sticker-note-limit" : undefined}
                      />
                      <input
                        className="sticker-note-name-input"
                        value={authorName}
                        maxLength={NAME_LIMIT}
                        onInput={(event) => updateAuthorName(event.currentTarget.value)}
                        onChange={(event) => updateAuthorName(event.target.value)}
                        placeholder="your name (optional)"
                        aria-label="Your name, optional"
                      />
                    </span>
                  ) : (
                    <span className="sticker-note-copy">
                      {modalMessage || "No note left. Just a sticker passing through."}
                    </span>
                  )}
                  {modalAuthorName || modalTimestamp ? (
                    <span className="sticker-note-meta">
                      {modalAuthorName ? <span className="sticker-note-author">~ {modalAuthorName}</span> : null}
                      {modalTimestamp ? (
                        <time className="sticker-note-date">{modalAuthorName ? modalTimestamp : `~ ${modalTimestamp}`}</time>
                      ) : null}
                    </span>
                  ) : null}
                </span>
              </div>
            </div>
            {previewSticker && noteError ? (
              <p className="sticker-note-error" role="alert">
                {noteError}
              </p>
            ) : null}
            {showNoteLimitWarning ? (
              <p id="sticker-note-limit" className="sticker-note-limit" role="status" aria-live="polite">
                {noteCharactersLeft > 0 ? `${noteCharactersLeft} characters left` : "No room left"}
              </p>
            ) : null}
            {previewSticker ? (
              <button
                type="button"
                className="sticker-sparkle-place"
                onClick={() => placeSticker()}
                disabled={!selectedSticker || allStickersUsed}
              >
                Pin it!
              </button>
            ) : (
              <p className="sticker-modal-hint">Tap to reveal!</p>
            )}
          </div>
        </div>
      ) : null}

      <style>{`
        @font-face {
          font-family: "La Belle Aurore";
          font-style: normal;
          font-weight: 400;
          font-display: swap;
          src: url("/assets/fonts/la-belle-aurore-latin.woff2") format("woff2");
        }

        .sticker-board-section {
          width: 100%;
          max-width: min(72rem, calc(100vw - 1rem));
          margin: 0 auto;
          padding: 0 1.75rem 3.75rem;
          color: rgb(23 23 23);
          overflow-x: clip;
          container: sticker-board / inline-size;
        }

        html.dark .sticker-board-section {
          color: rgb(245 245 245);
        }

        .sticker-board-heading {
          max-width: 34rem;
          margin-bottom: 1.35rem;
        }

        .sticker-board-heading h2 {
          margin: 0;
          color: rgb(23 23 23);
          font-size: 1.5rem;
          font-weight: 700;
          line-height: 1.25;
          letter-spacing: 0;
        }

        .sticker-board-heading p {
          margin: 0.55rem 0 0;
          color: rgb(82 82 82);
          font-size: 0.95rem;
          line-height: 1.65;
        }

        html.dark .sticker-board-heading h2 {
          color: rgb(245 245 245);
        }

        html.dark .sticker-board-heading p {
          color: rgb(163 163 163);
        }

        .sticker-board-shell {
          --board-block-size: clamp(31rem, min(56cqw, 72dvh), 42rem);
          --board-inset: clamp(0.56rem, 1.1cqw, 0.9rem);
          --board-pad-block: clamp(1rem, 1.8cqw, 1.55rem);
          --board-pad-inline: clamp(0.92rem, 1.7cqw, 1.35rem);
          --board-radius: clamp(18px, 2.1cqw, 24px);
          --board-inner-radius: calc(var(--board-radius) - 4px);
          --board-row-gap: clamp(0.72rem, 1.7cqw, 1.25rem);
          --board-slot-gap: clamp(0.4rem, 1cqw, 0.95rem);
          --composer-inline: clamp(13.2rem, 18cqw, 16.2rem);
          --composer-shift: clamp(-3.2rem, -3.6cqw, -1.75rem);
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, var(--composer-inline));
          gap: clamp(0.75rem, 1.9cqw, 1.35rem);
          align-items: stretch;
          position: relative;
        }

        .sticker-board-panel {
          background:
            radial-gradient(circle at 16% 0%, rgb(255 255 255 / 0.045), transparent 20rem),
            radial-gradient(circle at 84% 96%, rgb(146 118 70 / 0.045), transparent 20rem),
            rgb(8 8 8 / 0.84);
          box-shadow: 0 30px 76px rgb(0 0 0 / 0.28);
        }

        html.dark .sticker-board-panel {
          background:
            radial-gradient(circle at 16% 0%, rgb(255 255 255 / 0.036), transparent 22rem),
            radial-gradient(circle at 84% 96%, rgb(146 118 70 / 0.04), transparent 20rem),
            rgb(6 6 6 / 0.88);
          box-shadow: 0 30px 82px rgb(0 0 0 / 0.3);
        }

        .sticker-board-panel {
          position: relative;
          overflow: hidden;
          block-size: var(--board-block-size);
          min-block-size: 28rem;
          border-radius: var(--board-radius);
          transform-origin: center top;
        }

        .sticker-board-surface {
          position: absolute;
          inset: var(--board-inset);
          overflow-x: auto;
          overflow-y: hidden;
          padding: var(--board-pad-block) var(--board-pad-inline);
          border-radius: var(--board-inner-radius);
          background:
            radial-gradient(circle at 18% 4%, rgb(255 255 255 / 0.035), transparent 18rem),
            radial-gradient(circle at 80% 82%, rgb(146 118 70 / 0.04), transparent 18rem),
            rgb(4 4 4 / 0.38);
          scroll-snap-type: x proximity;
          scrollbar-width: thin;
          scrollbar-color: rgb(255 255 255 / 0.16) transparent;
        }

        .sticker-board-surface::-webkit-scrollbar {
          height: 0.55rem;
        }

        .sticker-board-surface::-webkit-scrollbar-track {
          background: transparent;
        }

        .sticker-board-surface::-webkit-scrollbar-thumb {
          border-radius: 999px;
          background: rgb(255 255 255 / 0.14);
        }

        html.dark .sticker-board-surface {
          background:
            radial-gradient(circle at 18% 4%, rgb(255 255 255 / 0.032), transparent 18rem),
            radial-gradient(circle at 80% 82%, rgb(146 118 70 / 0.038), transparent 18rem),
            rgb(4 4 4 / 0.4);
        }

        .sticker-board-track {
          display: grid;
          grid-template-rows: repeat(${BOARD_ROWS}, minmax(0, 1fr));
          gap: var(--board-row-gap);
          width: 100%;
          min-width: 100%;
          height: 100%;
          animation: sticker-page-in 360ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .sticker-board-row {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: 100%;
          align-items: center;
          gap: var(--board-row-gap);
          width: 100%;
          min-height: 0;
        }

        .sticker-row-group {
          --row-tone: 226 226 226;
          position: relative;
          display: grid;
          grid-template-columns: repeat(${ROW_GROUP_SIZE}, minmax(0, 1fr));
          align-items: center;
          gap: var(--board-slot-gap);
          width: 100%;
          min-width: 100%;
          height: 100%;
          isolation: isolate;
          scroll-snap-align: start;
        }

        .sticker-row-group::before {
          content: "";
          position: absolute;
          inset: 4% 2%;
          z-index: -1;
          border-radius: 999px;
          opacity: 0.1;
          background: radial-gradient(ellipse at center, rgb(var(--row-tone) / 0.32), transparent 68%);
        }

        .sticker-slot {
          position: relative;
          display: grid;
          place-items: center;
          min-width: 0;
          min-height: 0;
          height: 100%;
          isolation: isolate;
          transform: translateY(clamp(-0.55rem, -0.9vw, -0.3rem)) translateZ(0);
        }

        .empty-sticker-slot {
          position: absolute;
          inset: 14%;
          z-index: 0;
          border-radius: 999px;
          opacity: 0.035;
          background: rgb(255 255 255 / 0.16);
          transform: scale(0.8);
          transition:
            opacity 220ms cubic-bezier(0.2, 0.85, 0.35, 1),
            transform 220ms cubic-bezier(0.2, 0.85, 0.35, 1),
            box-shadow 220ms ease,
            background 220ms ease;
        }

        html.dark .empty-sticker-slot {
          background: rgb(255 255 255 / 0.04);
          box-shadow:
            inset 0 1px 0 rgb(255 255 255 / 0.05),
            0 18px 44px rgb(0 0 0 / 0.24);
        }

        .placed-sticker,
        .selected-sticker {
          --tilt-x: 0deg;
          --tilt-y: 0deg;
          position: relative;
          z-index: 2;
          display: grid;
          place-items: center;
          width: 100%;
          height: 100%;
          padding: 0;
          border: 0;
          background: transparent;
          color: inherit;
          cursor: pointer;
          transform:
            perspective(860px)
            rotateX(var(--tilt-x))
            rotateY(var(--tilt-y));
          transform-style: preserve-3d;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          transition:
            transform 180ms cubic-bezier(0.2, 0.85, 0.35, 1),
            opacity 120ms ease;
        }

        .placed-sticker {
          width: var(--sticker-board-inline, 9rem);
          height: auto;
          max-width: 122%;
          max-height: 122%;
          aspect-ratio: var(--sticker-aspect, 1);
          transform:
            perspective(860px)
            rotateX(var(--tilt-x))
            rotateY(var(--tilt-y))
            translate(calc(var(--slot-x, 0px) + var(--slot-edge-x, 0px)), var(--slot-y, 0))
            scale(calc(var(--slot-scale, 1) * var(--sticker-presence, 1)))
            rotate(var(--slot-rotation, 0deg));
        }

        .placed-sticker:hover,
        .placed-sticker:focus-visible {
          z-index: 9;
          transform:
            perspective(860px)
            rotateX(var(--tilt-x))
            rotateY(var(--tilt-y))
            translateY(-4px)
            translate(calc(var(--slot-x, 0px) + var(--slot-edge-x, 0px)), var(--slot-y, 0))
            scale(calc(var(--slot-scale, 1) * var(--sticker-presence, 1) * 1.075))
            rotate(var(--slot-rotation, 0deg));
        }

        .placed-sticker.is-departing-to-focus {
          z-index: 20;
          animation: none !important;
        }

        .placed-sticker.is-returning-from-focus {
          z-index: 20;
          animation: none !important;
        }

        .placed-sticker.is-departing-to-focus .placed-sticker-shape {
          animation: placed-sticker-depart 220ms cubic-bezier(0.4, 0, 0.2, 1) both;
          will-change: transform, opacity;
        }

        .placed-sticker.is-returning-from-focus .placed-sticker-shape {
          animation: placed-sticker-return 220ms cubic-bezier(0.4, 0, 0.2, 1) both;
          will-change: transform, opacity;
        }

        .placed-sticker:focus-visible,
        .selected-sticker-main:focus-visible,
        .sticker-pencil-action:focus-visible,
        .sticker-modal-close:focus-visible,
        .sticker-flip-object:focus-visible,
        .sticker-sparkle-place:focus-visible {
          outline: 2px solid rgb(212 212 212);
          outline-offset: 4px;
        }

        .placed-sticker.is-pending {
          opacity: 0.92;
        }

        .placed-sticker.is-new {
          animation: placed-sticker-snap 520ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .placed-sticker-shape {
          position: relative;
          display: grid;
          place-items: center;
          width: 100%;
          height: 100%;
          max-width: 100%;
          max-height: 100%;
          isolation: isolate;
          transform: translateZ(42px);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        .placed-sticker-shape::before,
        .selected-sticker-float::before,
        .sticker-flip-front::before {
          content: "";
          position: absolute;
          inset: calc(var(--sticker-frame-pad, 0.18rem) * -1);
          z-index: 0;
          border: 1px solid rgb(255 255 255 / 0.13);
          border-radius: 13px;
          background: rgb(18 18 18 / 0.82);
          box-shadow:
            inset 0 1px 0 rgb(255 255 255 / 0.055),
            inset 0 -1px 0 rgb(0 0 0 / 0.28),
            0 10px 22px rgb(0 0 0 / 0.18);
          pointer-events: none;
          opacity: 0.92;
        }

        .placed-sticker-shape::after,
        .selected-sticker::after {
          content: "";
          position: absolute;
          inset: -16%;
          opacity: 0;
          pointer-events: none;
          background: radial-gradient(
            ellipse at 50% 50%,
            rgb(255 255 255 / 0.058),
            rgb(255 255 255 / 0.024) 28%,
            transparent 62%
          );
          transition: opacity 120ms ease;
        }

        .placed-sticker:hover .placed-sticker-shape::after,
        .placed-sticker:focus-visible .placed-sticker-shape::after,
        .selected-sticker:hover::after,
        .selected-sticker:focus-within::after {
          opacity: 0.42;
        }

        .placed-sticker img,
        .sticker-flip-front img {
          position: relative;
          z-index: 1;
          display: block;
          width: 100%;
          height: 100%;
          max-width: calc(116% * var(--sticker-presence, 1));
          max-height: calc(116% * var(--sticker-presence, 1));
          border-radius: 10px;
          object-fit: contain;
          user-select: none;
          -webkit-user-drag: none;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        .sticker-composer {
          display: grid;
          place-items: center;
          align-self: stretch;
          min-width: 0;
          max-width: 100%;
          overflow: visible;
          padding: clamp(1.3rem, 2.8cqw, 2rem) 0;
          background: transparent;
          box-shadow: none;
          transform: translateX(var(--composer-shift));
        }

        .selected-sticker-card {
          position: relative;
          display: grid;
          place-items: center;
          width: min(18.2rem, 100%);
          max-width: 100%;
          min-width: 0;
          min-height: min(100%, var(--board-block-size));
          transform: none;
        }

        .selected-sticker-stage {
          position: relative;
          display: grid;
          place-items: center;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          min-height: clamp(19rem, min(35cqw, 58dvh), 25.5rem);
          overflow: visible;
          perspective: 1000px;
          transform: translateY(clamp(-0.7rem, -0.7cqw, -0.25rem));
        }

        .selected-sticker-stage::before {
          content: "";
          position: absolute;
          inset: 14% 4% 4%;
          pointer-events: none;
          background: radial-gradient(ellipse at center, rgb(0 0 0 / 0.32), transparent 58%);
          transform: translateY(1.6rem);
        }

        .selected-sticker {
          --resting-tilt-x: 2.4deg;
          --resting-tilt-y: -5.6deg;
          --resting-turn: -1.4deg;
          --hover-lift: 0px;
          --hover-scale: 1;
          width: min(var(--sticker-selected-inline, 12rem), 100%);
          max-width: 100%;
          aspect-ratio: var(--sticker-aspect, 1);
          height: auto;
          min-height: 0;
          max-height: none;
          padding: 0;
          overflow: visible;
          cursor: pointer;
          touch-action: manipulation;
          transform:
            perspective(860px)
            translateY(var(--hover-lift))
            rotateX(calc(var(--resting-tilt-x) + var(--tilt-x)))
            rotateY(calc(var(--resting-tilt-y) + var(--tilt-y)))
            rotateZ(var(--resting-turn))
            scale(calc(var(--sticker-presence, 1) * var(--hover-scale)));
        }

        .selected-sticker-float {
          position: relative;
          isolation: isolate;
          display: grid;
          place-items: center;
          width: 100%;
          height: 100%;
          transform: translateY(0) rotateX(0deg) rotateY(0deg) rotateZ(0deg);
          transform-style: preserve-3d;
          transition: transform 520ms cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform;
        }

        .selected-sticker-callout {
          position: absolute;
          z-index: 3;
          bottom: calc(100% + clamp(0.62rem, 1.65cqw, 1rem));
          left: 50%;
          width: max-content;
          max-width: min(14rem, 72vw);
          color: rgb(245 245 245 / 0.76);
          font-family: "La Belle Aurore", "Bradley Hand", "Segoe Print", cursive;
          font-size: clamp(1rem, 2.4cqw, 1.28rem);
          font-weight: 400;
          line-height: 1;
          letter-spacing: 0;
          text-align: center;
          pointer-events: none;
          text-shadow: 0 7px 22px rgb(0 0 0 / 0.46);
          transform: translateX(-50%) rotate(-2deg);
        }

        .selected-sticker-image {
          position: relative;
          z-index: 1;
          display: block;
          width: 100%;
          height: 100%;
          max-width: none;
          max-height: none;
          border-radius: 10px;
          object-fit: contain;
          user-select: none;
          -webkit-user-drag: none;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          transform-origin: center;
        }

        .selected-sticker:hover,
        .selected-sticker:focus-within {
          --hover-lift: -5px;
          --hover-scale: 1.055;
        }

        .selected-sticker.is-departing-right {
          z-index: 20;
          pointer-events: none;
          animation: selected-sticker-depart-right 720ms cubic-bezier(0.55, 0, 0.25, 1) both;
          will-change: transform, opacity;
        }

        .selected-sticker.is-returning-from-right {
          z-index: 20;
          pointer-events: none;
          animation: selected-sticker-return-right 720ms cubic-bezier(0.55, 0, 0.25, 1) both;
          will-change: transform, opacity;
        }

        .selected-sticker.is-departing-right .selected-sticker-float,
        .selected-sticker.is-returning-from-right .selected-sticker-float {
          animation: none !important;
        }

        .selected-sticker-stage:has(.selected-sticker.is-departing-right)::before {
          animation: none;
          opacity: 0;
          transform: translate(2.5rem, 2rem) scale(0.62);
          transition:
            opacity 220ms ease,
            transform 360ms cubic-bezier(0.65, 0, 0.35, 1);
        }

        .selected-sticker:hover .selected-sticker-float,
        .selected-sticker:focus-within .selected-sticker-float {
          animation: none;
          transform: translateY(0) rotateX(0deg) rotateY(0deg) rotateZ(0deg);
        }

        .selected-sticker.is-disabled {
          cursor: not-allowed;
          opacity: 0.58;
        }

        .selected-sticker-main {
          position: relative;
          z-index: 1;
          display: grid;
          place-items: center;
          width: 100%;
          height: 100%;
          padding: 0;
          border: 0;
          border-radius: 11px;
          background: transparent;
          color: inherit;
          cursor: pointer;
        }

        .selected-sticker-main:disabled {
          cursor: not-allowed;
        }

        .selected-sticker-loading {
          width: 2rem;
          height: 2rem;
          border-radius: 999px;
          background:
            rgb(163 163 163 / 0.12);
        }

        .sticker-pencil-action {
          --pencil-lift: 0px;
          --pencil-scale: 1;
          --sticker-action-nudge-x: 0rem;
          position: absolute;
          top: 50%;
          left: 50%;
          z-index: 5;
          display: grid;
          place-items: center;
          width: 2.55rem;
          height: 2.55rem;
          padding: 0;
          border: 1px solid rgb(255 255 255 / 0.28);
          border-radius: 999px;
          background: linear-gradient(180deg, rgb(247 245 238), rgb(215 210 198));
          color: rgb(8 8 8);
          cursor: pointer;
          transform:
            translate(calc(var(--sticker-action-x, 5rem) + var(--sticker-action-nudge-x)), var(--sticker-action-y, 5rem))
            translate(-50%, calc(-50% + var(--pencil-lift)))
            scale(var(--pencil-scale));
          box-shadow:
            inset 0 1px 0 rgb(255 255 255 / 0.78),
            inset 0 -1px 0 rgb(0 0 0 / 0.18),
            0 13px 24px rgb(0 0 0 / 0.38);
          transition:
            transform 160ms ease,
            border-color 160ms ease,
            background 180ms ease,
            opacity 180ms ease;
        }

        .sticker-pencil-action img {
          display: block;
          width: 1.16rem;
          height: 1.16rem;
          object-fit: contain;
          opacity: 0.86;
          user-select: none;
          -webkit-user-drag: none;
        }

        .sticker-pencil-action:hover:not(:disabled),
        .sticker-pencil-action:focus-visible {
          --pencil-lift: -2px;
          --pencil-scale: 1.035;
          border-color: rgb(255 255 255 / 0.42);
          background: linear-gradient(180deg, rgb(255 255 250), rgb(230 225 212));
        }

        .sticker-pencil-action:active:not(:disabled) {
          --pencil-lift: 0px;
          --pencil-scale: 0.98;
        }

        .sticker-pencil-action:disabled {
          opacity: 0.42;
          cursor: not-allowed;
        }

        .sticker-modal {
          position: fixed;
          inset: 0;
          z-index: 80;
          display: grid;
          place-items: center;
          padding: clamp(1.2rem, 4vw, 3rem);
        }

        .sticker-modal-backdrop {
          position: absolute;
          inset: 0;
          border: 0;
          background: rgb(0 0 0 / 0.78);
          cursor: pointer;
        }

        .sticker-modal.is-closing .sticker-modal-backdrop {
          pointer-events: none;
          animation: sticker-modal-backdrop-out 560ms ease-in both;
        }

        .sticker-modal.is-closing:has(.is-leaving-to-board) .sticker-modal-backdrop {
          animation-duration: 280ms;
        }

        .sticker-modal-card {
          position: relative;
          z-index: 1;
          display: grid;
          justify-items: center;
          gap: 1rem;
          width: min(calc(100vw - 2rem), 44rem);
          padding: 0;
          border-radius: 0;
          background: transparent;
          color: rgb(245 245 245);
          box-shadow: none;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          animation: sticker-modal-in 260ms cubic-bezier(0.2, 0.85, 0.35, 1) both;
        }

        .sticker-modal-card.is-arriving-from-bottom {
          animation: sticker-modal-arrive-from-bottom 700ms cubic-bezier(0.18, 0.82, 0.28, 1) both;
          will-change: transform, opacity;
        }

        .sticker-modal-card.is-arriving-from-board {
          animation: sticker-modal-arrive-from-board 360ms cubic-bezier(0.16, 1, 0.3, 1) both;
          will-change: transform, opacity;
        }

        .sticker-modal-card.is-leaving-to-bottom {
          pointer-events: none;
          animation: sticker-modal-leave-to-bottom 560ms cubic-bezier(0.55, 0, 0.8, 0.45) both;
          will-change: transform, opacity;
        }

        .sticker-modal-card.is-leaving-to-board {
          pointer-events: none;
          animation: sticker-modal-leave-to-board 280ms cubic-bezier(0.55, 0, 0.8, 0.45) both;
          will-change: transform, opacity;
        }

        .sticker-modal-frame {
          position: relative;
          display: grid;
          place-items: center;
          width: min(var(--flip-inline, 24rem), calc(100vw - 3rem));
          isolation: isolate;
        }

        .sticker-modal-card.is-writing .sticker-modal-frame {
          width: min(var(--flip-inline, 30rem), calc(100vw - 2.5rem));
        }

        .sticker-modal-close {
          position: absolute;
          top: clamp(-0.92rem, -1.2vw, -0.58rem);
          right: clamp(-0.92rem, -1.2vw, -0.48rem);
          z-index: 4;
          display: grid;
          place-items: center;
          width: 2.28rem;
          height: 2.28rem;
          border: 1px solid rgb(255 255 255 / 0.14);
          border-radius: 999px;
          background: rgb(12 12 12 / 0.94);
          color: rgb(245 245 245);
          font-size: 1.32rem;
          font-weight: 300;
          line-height: 1;
          cursor: pointer;
          box-shadow:
            inset 0 1px 0 rgb(255 255 255 / 0.08),
            0 14px 30px rgb(0 0 0 / 0.42);
          transition:
            transform 160ms ease,
            border-color 160ms ease,
            background 160ms ease,
            color 160ms ease;
        }

        .sticker-modal-close:hover,
        .sticker-modal-close:focus-visible {
          border-color: rgb(255 255 255 / 0.34);
          background: rgb(245 245 245);
          color: rgb(10 10 10);
          transform: translateY(-1px) scale(1.04);
        }

        .sticker-modal-close:active {
          transform: translateY(0) scale(0.97);
        }

        .sticker-flip-object {
          position: relative;
          width: 100%;
          aspect-ratio: var(--flip-aspect, 1);
          border: 0;
          background: transparent;
          perspective: 1200px;
          transform-style: preserve-3d;
          cursor: pointer;
        }

        .sticker-flip-face {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          padding: clamp(0.9rem, 4.5%, 1.25rem);
          border-radius: 16px;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          box-shadow:
            0 34px 90px rgb(0 0 0 / 0.58),
            0 0 0 1px rgb(255 255 255 / 0.035);
          transition:
            opacity 160ms ease,
            transform 460ms cubic-bezier(0.2, 0.85, 0.35, 1);
          transform-style: preserve-3d;
          will-change: transform, opacity;
        }

        .sticker-flip-front {
          --sticker-frame-pad: 0.2rem;
          padding: clamp(0.22rem, 1.2%, 0.42rem);
          background: transparent;
          opacity: 1;
          transform: rotateY(0deg) translateZ(2px);
        }

        .sticker-flip-front img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        .sticker-flip-back {
          background:
            linear-gradient(90deg, transparent 0 13%, rgb(224 116 116 / 0.34) 13.25%, transparent 13.7%),
            repeating-linear-gradient(
              0deg,
              rgb(252 248 232) 0 1.62rem,
              rgb(123 166 203 / 0.28) 1.66rem,
              rgb(252 248 232) 1.72rem
            );
          color: rgb(44 41 36);
          font-family: "La Belle Aurore", "Bradley Hand", "Segoe Print", cursive;
          font-size: clamp(1.22rem, 4.7vw, 1.78rem);
          font-weight: 400;
          line-height: 1.32;
          text-align: center;
          overflow-wrap: anywhere;
          opacity: 0;
          pointer-events: none;
          overflow: hidden;
          transform: rotateY(180deg) translateZ(1px);
        }

        .sticker-note-doodle {
          position: absolute;
          top: var(--note-doodle-y);
          left: var(--note-doodle-x);
          width: clamp(2.25rem, 12.5%, 4.05rem);
          max-width: 20%;
          height: auto;
          object-fit: contain;
          opacity: var(--note-doodle-opacity);
          pointer-events: none;
          transform: rotate(var(--note-doodle-rotate)) scale(var(--note-doodle-scale));
          transform-origin: 45% 50%;
          z-index: 0;
        }

        .sticker-note-copy {
          display: block;
          max-width: 90%;
          position: relative;
          transform: rotate(-1deg);
          z-index: 1;
        }

        .sticker-note-meta {
          position: absolute;
          right: clamp(1.18rem, 7.2%, 1.9rem);
          bottom: clamp(1.02rem, 6.4%, 1.5rem);
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.34rem;
          color: rgb(44 41 36 / 0.64);
          font: inherit;
          letter-spacing: 0;
          pointer-events: none;
          transform: rotate(-2deg);
          z-index: 2;
        }

        .sticker-note-author,
        .sticker-note-date {
          display: block;
          max-width: min(10rem, 42vw);
          line-height: 1.22;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sticker-note-author {
          color: rgb(44 41 36 / 0.74);
          font-size: clamp(0.9rem, 3.3vw, 1.15rem);
          padding-bottom: 0.18em;
          transform: translateY(-0.28rem);
        }

        .sticker-note-date {
          color: rgb(44 41 36 / 0.64);
          font-size: clamp(0.82rem, 3.1vw, 1.08rem);
          transform: translateY(-0.08rem);
        }

        .sticker-note-editor {
          --note-font-scale: 1;
          display: grid;
          place-items: center;
          gap: clamp(0.32rem, 1.2vw, 0.52rem);
          width: 88%;
          min-height: 72%;
          max-height: 78%;
          font-size: calc(1em * var(--note-font-scale));
          transform: rotate(-1deg);
          z-index: 1;
        }

        .sticker-note-editor.is-compact {
          --note-font-scale: 0.86;
        }

        .sticker-note-editor.is-dense {
          --note-font-scale: 0.72;
        }

        .sticker-note-input {
          display: block;
          width: 100%;
          max-height: 100%;
          resize: none;
          border: 0;
          background: transparent;
          color: rgb(44 41 36);
          font: inherit;
          line-height: 1.32;
          text-align: center;
          outline: none;
          overflow: hidden;
          scrollbar-width: none;
        }

        .sticker-note-input::placeholder {
          color: rgb(44 41 36 / 0.36);
          opacity: 1;
        }

        .sticker-note-input::-webkit-scrollbar {
          display: none;
        }

        .sticker-note-name-input {
          width: min(72%, 15rem);
          border: 0;
          border-bottom: 1px solid rgb(44 41 36 / 0.2);
          background: transparent;
          color: rgb(44 41 36 / 0.82);
          font: inherit;
          font-size: 0.72em;
          line-height: 1.15;
          text-align: center;
          outline: none;
        }

        .sticker-note-name-input::placeholder {
          color: rgb(44 41 36 / 0.3);
          opacity: 1;
        }

        .sticker-note-name-input:focus {
          border-bottom-color: rgb(44 41 36 / 0.42);
        }

        .sticker-note-error,
        .sticker-note-limit {
          margin: -0.35rem 0 0;
          color: rgb(255 219 176);
          font-size: 0.82rem;
          font-weight: 600;
          line-height: 1.45;
          text-align: center;
        }

        .sticker-note-limit {
          color: rgb(245 245 245 / 0.58);
          font-size: 0.76rem;
          font-weight: 500;
          letter-spacing: 0;
        }

        .sticker-note-error + .sticker-note-limit {
          margin-top: 0.1rem;
        }

        .sticker-flip-object.is-flipped .sticker-flip-front {
          opacity: 0;
          pointer-events: none;
          transform: rotateY(-180deg) translateZ(1px);
        }

        .sticker-flip-object.is-flipped .sticker-flip-back {
          opacity: 1;
          pointer-events: auto;
          transform: rotateY(0deg) translateZ(2px);
        }

        .sticker-modal-hint {
          margin: 0.48rem 0 0;
          color: rgb(163 163 163);
          font-size: 0.75rem;
          line-height: 1.4;
        }

        .sticker-sparkle-place {
          position: relative;
          display: inline-grid;
          place-items: center;
          min-width: 7.25rem;
          min-height: 2.72rem;
          padding: 0 1.42rem;
          border: 1px solid rgb(255 255 255 / 0.3);
          border-radius: 999px;
          background:
            radial-gradient(circle at 32% 12%, rgb(255 255 255 / 0.92), transparent 42%),
            linear-gradient(180deg, rgb(255 253 246), rgb(226 220 206));
          color: rgb(15 13 10);
          font-size: 0.88rem;
          font-weight: 720;
          letter-spacing: 0.01em;
          line-height: 1;
          cursor: pointer;
          box-shadow:
            inset 0 1px 0 rgb(255 255 255 / 0.78),
            inset 0 -1px 0 rgb(61 43 20 / 0.16),
            0 14px 30px rgb(0 0 0 / 0.34),
            0 2px 12px rgb(182 151 82 / 0.12);
          text-shadow: 0 1px 0 rgb(255 255 255 / 0.55);
          transition:
            transform 160ms ease,
            border-color 160ms ease,
            background 180ms ease,
            box-shadow 180ms ease;
        }

        .sticker-sparkle-place:hover:not(:disabled),
        .sticker-sparkle-place:focus-visible {
          border-color: rgb(255 255 255 / 0.38);
          background:
            radial-gradient(circle at 34% 10%, rgb(255 255 255 / 0.98), transparent 44%),
            linear-gradient(180deg, rgb(255 255 252), rgb(236 229 214));
          box-shadow:
            inset 0 1px 0 rgb(255 255 255 / 0.82),
            inset 0 -1px 0 rgb(61 43 20 / 0.16),
            0 17px 36px rgb(0 0 0 / 0.38),
            0 3px 16px rgb(203 166 83 / 0.16);
          transform: translateY(-2px) scale(1.025);
        }

        .sticker-sparkle-place:active:not(:disabled) {
          transform: translateY(0) scale(0.985);
        }

        .sticker-sparkle-place:disabled {
          opacity: 0.44;
          cursor: not-allowed;
        }

        @keyframes sticker-page-in {
          from {
            opacity: 0;
            transform: translateY(0.45rem) scale(0.992);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes placed-sticker-snap {
          0% {
            opacity: 0;
            transform:
              perspective(860px)
              translateY(-0.2rem)
              scale(0.92)
              rotate(var(--slot-rotation, 0deg));
          }
          54% {
            opacity: 1;
            transform:
              perspective(860px)
              translateY(0)
              scale(1.035)
              rotate(var(--slot-rotation, 0deg));
          }
          100% {
            opacity: 1;
            transform:
              perspective(860px)
              translateY(0)
              scale(1)
              rotate(var(--slot-rotation, 0deg));
          }
        }

        @keyframes placed-sticker-depart {
          0% {
            opacity: 1;
            transform: translateZ(42px) scale(1);
          }
          62% {
            opacity: 0.72;
            transform: translateZ(42px) scale(0.58);
          }
          100% {
            opacity: 0;
            transform: translateZ(42px) scale(0.06);
          }
        }

        @keyframes placed-sticker-return {
          0% {
            opacity: 0;
            transform: translateZ(42px) scale(0.06);
          }
          38% {
            opacity: 0.72;
            transform: translateZ(42px) scale(0.58);
          }
          100% {
            opacity: 1;
            transform: translateZ(42px) scale(1);
          }
        }

        @keyframes selected-sticker-depart-right {
          0% {
            opacity: 1;
            transform:
              perspective(860px)
              translateX(0)
              translateY(var(--hover-lift))
              rotateX(calc(var(--resting-tilt-x) + var(--tilt-x)))
              rotateY(calc(var(--resting-tilt-y) + var(--tilt-y)))
              rotateZ(var(--resting-turn))
              scale(calc(var(--sticker-presence, 1) * var(--hover-scale)));
          }
          22% {
            opacity: 1;
            transform:
              perspective(860px)
              translateX(-0.32rem)
              translateY(0.12rem)
              rotateX(0.5deg)
              rotateY(-3deg)
              rotateZ(-2deg)
              scale(calc(var(--sticker-presence, 1) * 0.99));
          }
          62% {
            opacity: 1;
            transform:
              perspective(860px)
              translateX(44vw)
              translateY(-0.55rem)
              rotateX(0deg)
              rotateY(1deg)
              rotateZ(3.5deg)
              scale(calc(var(--sticker-presence, 1) * 1.01));
          }
          100% {
            opacity: 0;
            transform:
              perspective(860px)
              translateX(142vw)
              translateY(-0.8rem)
              rotateX(0deg)
              rotateY(0deg)
              rotateZ(7deg)
              scale(calc(var(--sticker-presence, 1) * 0.92));
          }
        }

        @keyframes selected-sticker-return-right {
          0% {
            opacity: 0;
            transform:
              perspective(860px)
              translateX(142vw)
              translateY(-0.8rem)
              rotateX(0deg)
              rotateY(0deg)
              rotateZ(7deg)
              scale(calc(var(--sticker-presence, 1) * 0.92));
          }
          38% {
            opacity: 1;
            transform:
              perspective(860px)
              translateX(44vw)
              translateY(-0.55rem)
              rotateX(0deg)
              rotateY(1deg)
              rotateZ(3.5deg)
              scale(calc(var(--sticker-presence, 1) * 1.01));
          }
          78% {
            opacity: 1;
            transform:
              perspective(860px)
              translateX(-0.32rem)
              translateY(0.12rem)
              rotateX(0.5deg)
              rotateY(-3deg)
              rotateZ(-2deg)
              scale(calc(var(--sticker-presence, 1) * 0.99));
          }
          100% {
            opacity: 1;
            transform:
              perspective(860px)
              translateX(0)
              translateY(0)
              rotateX(var(--resting-tilt-x))
              rotateY(var(--resting-tilt-y))
              rotateZ(var(--resting-turn))
              scale(var(--sticker-presence, 1));
          }
        }

        @keyframes sticker-modal-in {
          from {
            opacity: 0;
            transform: translateY(0.75rem) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes sticker-modal-backdrop-out {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        @keyframes sticker-modal-arrive-from-bottom {
          0% {
            opacity: 0;
            transform: translateY(46vh) rotate(3deg) scale(0.86);
          }
          76% {
            opacity: 1;
            transform: translateY(-0.38rem) rotate(-0.3deg) scale(1.008);
          }
          100% {
            opacity: 1;
            transform: translateY(0) rotate(0deg) scale(1);
          }
        }

        @keyframes sticker-modal-leave-to-bottom {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg) scale(1);
          }
          24% {
            opacity: 1;
            transform: translateY(-0.38rem) rotate(-0.3deg) scale(1.008);
          }
          100% {
            opacity: 0;
            transform: translateY(46vh) rotate(3deg) scale(0.86);
          }
        }

        @keyframes sticker-modal-arrive-from-board {
          0% {
            opacity: 0;
            transform: translateY(2.4rem) rotate(-2.6deg) scale(0.8);
          }
          64% {
            opacity: 1;
            transform: translateY(-0.42rem) rotate(0.5deg) scale(1.025);
          }
          82% {
            opacity: 1;
            transform: translateY(0.16rem) rotate(-0.15deg) scale(0.995);
          }
          100% {
            opacity: 1;
            transform: translateY(0) rotate(0deg) scale(1);
          }
        }

        @keyframes sticker-modal-leave-to-board {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg) scale(1);
          }
          18% {
            opacity: 1;
            transform: translateY(0.16rem) rotate(-0.15deg) scale(0.995);
          }
          36% {
            opacity: 1;
            transform: translateY(-0.42rem) rotate(0.5deg) scale(1.025);
          }
          100% {
            opacity: 0;
            transform: translateY(2.4rem) rotate(-2.6deg) scale(0.8);
          }
        }

        @keyframes selected-sticker-float {
          0%,
          100% {
            transform: translateY(0) rotateX(0deg) rotateY(0deg) rotateZ(0deg);
          }
          24% {
            transform: translateY(-8.5px) rotateX(2.25deg) rotateY(-3.35deg) rotateZ(-0.64deg);
          }
          52% {
            transform: translateY(-5.5px) rotateX(-0.45deg) rotateY(3deg) rotateZ(0.34deg);
          }
          76% {
            transform: translateY(-10.8px) rotateX(1.55deg) rotateY(-1.75deg) rotateZ(-0.48deg);
          }
        }

        @keyframes selected-sticker-shadow-float {
          0%,
          100% {
            opacity: 0.74;
            transform: translateY(1.72rem) scale(1);
          }
          24% {
            opacity: 0.56;
            transform: translateY(2.05rem) scale(1.13);
          }
          52% {
            opacity: 0.68;
            transform: translateY(1.82rem) scale(1.04);
          }
          76% {
            opacity: 0.5;
            transform: translateY(2.12rem) scale(1.18);
          }
        }

        @media (prefers-reduced-motion: no-preference) {
          .selected-sticker:not(.is-disabled) .selected-sticker-float {
            animation: selected-sticker-float 6.2s cubic-bezier(0.45, 0, 0.22, 1) infinite;
          }

          .selected-sticker-stage::before {
            animation: selected-sticker-shadow-float 6.2s cubic-bezier(0.45, 0, 0.22, 1) infinite;
          }

          .selected-sticker-stage:has(.selected-sticker:hover)::before,
          .selected-sticker-stage:has(.selected-sticker:focus-within)::before {
            animation: none;
            opacity: 0.74;
            transform: translateY(1.72rem) scale(1);
            transition:
              opacity 420ms ease,
              transform 520ms cubic-bezier(0.16, 1, 0.3, 1);
          }
        }

        @container sticker-board (max-width: 64rem) {
          .sticker-board-shell {
            --board-block-size: clamp(30rem, min(68cqw, 70dvh), 38.5rem);
            --composer-inline: clamp(9.75rem, 20cqw, 12rem);
            grid-template-columns: 1fr;
          }

          .sticker-board-panel,
          .sticker-composer {
            grid-area: 1 / 1;
          }

          .sticker-composer {
            position: absolute;
            z-index: 6;
            inset-block: 0;
            inset-inline-end: clamp(0.45rem, 1.6cqw, 1.15rem);
            justify-self: end;
            width: var(--composer-inline);
            padding: 0;
            pointer-events: none;
            transform: none;
          }

          .selected-sticker-card {
            width: 100%;
            min-height: 100%;
            pointer-events: auto;
          }

          .selected-sticker-stage {
            min-height: 100%;
            transform: translateY(clamp(-0.85rem, -1cqw, -0.28rem));
          }

          .selected-sticker {
            width: min(var(--sticker-selected-inline, 12rem), 96%);
          }
        }

        @media (min-width: 761px) and (max-width: 1099px) {
          .sticker-board-section {
            padding-inline: clamp(1.25rem, 2.4vw, 1.75rem) clamp(3.25rem, 6vw, 4.25rem);
          }

          .sticker-composer {
            inset-inline-end: clamp(0.35rem, 1.4cqw, 0.9rem);
            width: clamp(9.75rem, 20cqw, 12rem);
          }

          .selected-sticker {
            width: min(var(--sticker-selected-inline, 11.6rem), 88%);
          }

          .selected-sticker-callout {
            bottom: calc(100% + 0.56rem);
            font-size: clamp(0.88rem, 1.8cqw, 1.02rem);
          }

          .sticker-pencil-action {
            --sticker-action-nudge-x: -0.55rem;
            width: 2.42rem;
            height: 2.42rem;
          }
        }

        @container sticker-board (min-width: 66rem) {
          .sticker-board-shell {
            --board-block-size: clamp(34rem, min(53cqw, 74dvh), 43.5rem);
            --composer-inline: clamp(14.2rem, 16cqw, 17.25rem);
            --composer-shift: clamp(-3.45rem, -3cqw, -2rem);
          }

          .selected-sticker-stage {
            min-height: clamp(21rem, min(32cqw, 60dvh), 26.25rem);
          }
        }

        @media (max-height: 720px) and (min-width: 761px) {
          .sticker-board-heading {
            margin-bottom: 0.95rem;
          }

          .sticker-board-shell {
            --board-block-size: clamp(28rem, min(52cqw, 68dvh), 36rem);
          }

          .selected-sticker-stage {
            min-height: clamp(17rem, min(30cqw, 55dvh), 22rem);
          }
        }

        @media (max-width: 760px) {
          .sticker-board-section {
            max-width: min(100%, calc(100vw - 0.25rem));
            padding: 0 clamp(0.9rem, 4vw, 1.25rem) 3rem;
          }

          .sticker-board-shell {
            --board-block-size: clamp(29rem, min(116cqw, 68dvh), 40.5rem);
            --board-inset: clamp(0.5rem, 2.4cqw, 0.66rem);
            --board-pad-block: clamp(0.9rem, 3.4cqw, 1.2rem);
            --board-pad-inline: clamp(0.74rem, 3cqw, 1rem);
            --board-row-gap: clamp(0.56rem, 3cqw, 0.88rem);
            --board-slot-gap: clamp(0.28rem, 2.1cqw, 0.5rem);
            grid-template-columns: 1fr;
            gap: clamp(0.75rem, 3.4vw, 1.1rem);
          }

          .sticker-board-panel,
          .sticker-composer {
            grid-area: auto;
          }

          .sticker-composer {
            position: relative;
            order: -1;
            inset: auto;
            justify-self: stretch;
            width: 100%;
            padding: 0;
            pointer-events: auto;
            transform: none;
          }

          .selected-sticker-card {
            width: min(20rem, 100%);
            min-height: clamp(10.75rem, 42vw, 14.5rem);
            transform: none;
          }

          .selected-sticker-stage {
            min-height: clamp(10.75rem, 42vw, 14.5rem);
            transform: translateY(0);
          }

          .selected-sticker {
            width: min(var(--sticker-selected-inline, 12.5rem), 66vw);
            max-height: none;
          }

          .selected-sticker-image {
            max-height: none;
          }

          .selected-sticker-callout {
            bottom: calc(100% + 0.52rem);
            font-size: clamp(0.9rem, 4.2vw, 1.08rem);
          }

          .sticker-board-panel {
            block-size: var(--board-block-size);
            min-block-size: 28rem;
          }

          .sticker-board-surface {
            inset: var(--board-inset);
            padding: var(--board-pad-block) var(--board-pad-inline) calc(var(--board-pad-block) + 0.26rem);
          }

          .sticker-modal {
            padding: 1rem;
          }

          .sticker-modal-card {
            width: min(calc(100vw - 2rem), 38rem);
          }

          .sticker-modal-frame {
            width: min(var(--flip-inline, 20rem), calc(100vw - 2.5rem));
          }

          .sticker-modal-close {
            top: -0.7rem;
            right: -0.38rem;
            width: 2.08rem;
            height: 2.08rem;
            font-size: 1.2rem;
          }
        }

        @media (max-width: 420px) {
          .sticker-board-shell {
            --board-block-size: clamp(27.5rem, min(126cqw, 66dvh), 38rem);
          }

          .sticker-board-panel {
            min-block-size: 26rem;
          }

          .selected-sticker {
            width: min(var(--sticker-selected-inline, 12rem), 72vw);
          }

          .sticker-pencil-action {
            width: 2.35rem;
            height: 2.35rem;
          }

          .sticker-modal-card {
            width: min(calc(100vw - 1.5rem), 34rem);
          }
        }

        @media (hover: none) {
          .placed-sticker:hover {
            transform:
              perspective(860px)
              rotate(var(--slot-rotation, 0deg));
          }

          .selected-sticker:hover {
            --hover-lift: 0px;
            --hover-scale: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .sticker-board-shell,
          .sticker-board-track,
          .placed-sticker,
          .placed-sticker-shape,
          .selected-sticker,
          .selected-sticker-float,
          .selected-sticker-image,
          .sticker-modal-card,
          .sticker-modal-close,
          .sticker-flip-face {
            animation: none !important;
            transition: none !important;
          }

          .placed-sticker:hover,
          .placed-sticker:focus-visible,
          .selected-sticker:hover,
          .selected-sticker:focus-within {
            transform: none;
          }
        }
      `}</style>
    </section>
  );
}
