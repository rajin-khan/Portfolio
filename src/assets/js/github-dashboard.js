const USERNAME = "rajin-khan";
const CACHE_KEY = "rajin-github-dashboard-v3";
const CACHE_TTL = 30 * 60 * 1000;
const MAX_COMMIT_PAGES = 10;
const RHYTHM_DEFAULT = "tap a bar, it has opinions";
const API_HEADERS = {
	Accept: "application/vnd.github+json",
	"X-GitHub-Api-Version": "2022-11-28",
};
const ENDPOINTS = {
	profile: `https://api.github.com/users/${USERNAME}`,
	repositories: `https://api.github.com/users/${USERNAME}/repos?type=owner&sort=pushed&per_page=100`,
};
const COMMIT_SEARCH_URL = `https://api.github.com/search/commits?q=${encodeURIComponent(
	`author:${USERNAME}`,
)}&sort=committer-date&order=desc&per_page=100`;

const numberFormatter = new Intl.NumberFormat("en-US");
const shortDateFormatter = new Intl.DateTimeFormat("en", {
	month: "short",
	day: "numeric",
	year: "numeric",
});
const compactDateFormatter = new Intl.DateTimeFormat("en", {
	month: "short",
	day: "numeric",
});
const dayNames = [
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
	"Sunday",
];

let activeCommitCell = null;
let popoverHideTimer = null;
let popoverHiddenTimer = null;

function query(selector) {
	return document.querySelector(selector);
}

function setText(selector, value) {
	const element = query(selector);
	if (element) element.textContent = value;
}

function formatNumber(value) {
	return Number.isFinite(Number(value))
		? numberFormatter.format(Number(value))
		: "--";
}

function formatDate(value, formatter = shortDateFormatter) {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? "Unknown" : formatter.format(date);
}

function formatRelativeTime(value) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "recently";
	const difference = Math.max(0, Date.now() - date.getTime());
	const minutes = Math.floor(difference / (1000 * 60));
	if (minutes < 1) return "just now";
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d ago`;
	return formatDate(value, compactDateFormatter);
}

function formatHour(hour) {
	const normalized = hour % 24;
	if (normalized === 0) return "midnight";
	if (normalized === 12) return "noon";
	return `${normalized % 12} ${normalized < 12 ? "AM" : "PM"}`;
}

function getCommitDate(commit) {
	return (
		commit?.commit?.author?.date || commit?.commit?.committer?.date || null
	);
}

function getCommitMessage(commit) {
	return commit?.commit?.message?.split("\n")[0] || "Untitled commit";
}

function getRepositoryName(commit) {
	return (
		commit?.repository?.full_name ||
		commit?.repository?.name ||
		"Unknown repository"
	);
}

function stripOwner(repository) {
	return String(repository).replace(`${USERNAME}/`, "");
}

function isBirthday(date) {
	return date.getMonth() === 6 && date.getDate() === 7;
}

function localDateKey(value) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "";
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function getIntensityLevel(count, max) {
	if (!count) return 0;
	const ratio = count / Math.max(1, max);
	if (ratio <= 0.25) return 1;
	if (ratio <= 0.5) return 2;
	if (ratio <= 0.75) return 3;
	return 4;
}

function getLanguageColor(language) {
	const colors = {
		C: "#8b949e",
		"C++": "#f34b7d",
		CSS: "#563d7c",
		Dart: "#00b4ab",
		Go: "#00add8",
		HTML: "#e34c26",
		Java: "#b07219",
		JavaScript: "#f1e05a",
		"Jupyter Notebook": "#da5b0b",
		Kotlin: "#a97bff",
		PHP: "#4f5d95",
		Python: "#3572a5",
		Ruby: "#701516",
		Rust: "#dea584",
		Shell: "#89e051",
		Swift: "#f05138",
		TypeScript: "#3178c6",
	};
	return colors[language] || "#8b949e";
}

function clearPopoverTimers() {
	window.clearTimeout(popoverHideTimer);
	window.clearTimeout(popoverHiddenTimer);
}

function hideCommitPopover({ immediate = false } = {}) {
	const popover = query("[data-commit-popover]");
	if (!(popover instanceof HTMLElement)) return;
	clearPopoverTimers();
	popover.dataset.open = "false";
	if (activeCommitCell instanceof HTMLElement) {
		activeCommitCell.setAttribute("aria-expanded", "false");
	}
	activeCommitCell = null;

	if (immediate) {
		popover.hidden = true;
		return;
	}

	popoverHiddenTimer = window.setTimeout(() => {
		if (popover.dataset.open === "false") popover.hidden = true;
	}, 140);
}

function scheduleCommitPopoverHide() {
	window.clearTimeout(popoverHideTimer);
	popoverHideTimer = window.setTimeout(() => hideCommitPopover(), 110);
}

function positionCommitPopover(popover, cell) {
	if (window.matchMedia("(hover: none), (max-width: 720px)").matches) return;
	const cellRect = cell.getBoundingClientRect();
	const popoverRect = popover.getBoundingClientRect();
	const gutter = 12;
	const centeredLeft =
		cellRect.left + cellRect.width / 2 - popoverRect.width / 2;
	const left = Math.min(
		Math.max(gutter, centeredLeft),
		window.innerWidth - popoverRect.width - gutter,
	);
	let top = cellRect.top - popoverRect.height - gutter;
	if (top < gutter) top = cellRect.bottom + gutter;

	popover.style.left = `${left}px`;
	popover.style.top = `${top}px`;
}

function showCommitPopover(day, cell) {
	const popover = query("[data-commit-popover]");
	if (!(popover instanceof HTMLElement) || !(cell instanceof HTMLButtonElement))
		return;

	clearPopoverTimers();
	if (activeCommitCell instanceof HTMLElement && activeCommitCell !== cell) {
		activeCommitCell.setAttribute("aria-expanded", "false");
	}
	activeCommitCell = cell;
	cell.setAttribute("aria-expanded", "true");

	const latest = day.commits[0];
	const count = day.commits.length;
	const birthday = isBirthday(day.date);
	const dateElement = query("[data-commit-popover-date]");
	const link = query("[data-commit-popover-link]");
	setText(
		"[data-commit-popover-date]",
		formatDate(day.date, compactDateFormatter),
	);
	setText(
		"[data-commit-popover-count]",
		`${count} ${count === 1 ? "commit" : "commits"}`,
	);
	setText(
		"[data-commit-popover-message]",
		birthday
			? "it was my birthday"
			: latest
				? getCommitMessage(latest)
				: "Nothing public landed here",
	);
	setText(
		"[data-commit-popover-repository]",
		birthday && latest
			? `also committed to ${stripOwner(getRepositoryName(latest))}`
			: birthday
				? "a good reason for a quiet square"
				: latest
					? stripOwner(getRepositoryName(latest))
					: "the keyboard got a quiet day",
	);

	if (dateElement instanceof HTMLTimeElement) dateElement.dateTime = day.key;
	if (link instanceof HTMLAnchorElement) {
		link.hidden = !latest;
		if (latest) link.href = latest.html_url;
	}

	popover.hidden = false;
	requestAnimationFrame(() => {
		popover.dataset.open = "true";
		positionCommitPopover(popover, cell);
	});
}

function setRhythmReadout(value) {
	setText("[data-rhythm-readout]", value);
}

function describeHour(hour, count) {
	if (!count) return "even Git took the hint";
	if (hour < 5) return "sleep was apparently optional";
	if (hour < 9) return "before the day could object";
	if (hour < 12) return "properly awake by then";
	if (hour < 17) return "the respectable work hours";
	if (hour < 21) return "one more thing became five";
	return "the late shift won";
}

function describeWeekday(index, count) {
	if (!count) return "the keyboard stayed quiet";
	return [
		"starting with intent",
		"momentum found",
		"right in the middle of it",
		"still going, naturally",
		"apparently not done yet",
		"weekend plans were code",
		"so much for a day off",
	][index];
}

function activateRhythmButton(button, text) {
	for (const active of document.querySelectorAll(
		"[data-hour-chart] [aria-pressed='true'], [data-weekday-chart] [aria-pressed='true']",
	)) {
		active.setAttribute("aria-pressed", "false");
	}
	button.setAttribute("aria-pressed", "true");
	setRhythmReadout(text);
}

function resetRhythmButton(button) {
	if (window.matchMedia("(hover: none)").matches) return;
	button.setAttribute("aria-pressed", "false");
	setRhythmReadout(RHYTHM_DEFAULT);
}

function bindRhythmButton(button, text) {
	button.addEventListener("mouseenter", () =>
		activateRhythmButton(button, text),
	);
	button.addEventListener("mouseleave", () => resetRhythmButton(button));
	button.addEventListener("focus", () => activateRhythmButton(button, text));
	button.addEventListener("blur", () => resetRhythmButton(button));
	button.addEventListener("click", () => activateRhythmButton(button, text));
}

function clearMonthlyBarSelection() {
	for (const active of document.querySelectorAll(
		"[data-event-chart] .event-column[aria-pressed='true']",
	)) {
		active.setAttribute("aria-pressed", "false");
	}
}

function activateMonthlyBar(column) {
	clearMonthlyBarSelection();
	column.setAttribute("aria-pressed", "true");
}

function resetMonthlyBar(column) {
	if (window.matchMedia("(hover: none)").matches) return;
	column.setAttribute("aria-pressed", "false");
}

function bindMonthlyBar(column) {
	column.addEventListener("mouseenter", () => activateMonthlyBar(column));
	column.addEventListener("mouseleave", () => resetMonthlyBar(column));
	column.addEventListener("focus", () => activateMonthlyBar(column));
	column.addEventListener("blur", () => resetMonthlyBar(column));
	column.addEventListener("click", () => activateMonthlyBar(column));
}

async function fetchJson(url) {
	const response = await fetch(url, {
		headers: API_HEADERS,
		cache: "no-store",
	});

	if (!response.ok) {
		const error = new Error(
			response.status === 403 ? "rate-limit" : `github-${response.status}`,
		);
		error.status = response.status;
		throw error;
	}

	return response.json();
}

async function fetchCommitHistory() {
	const cutoff = new Date();
	cutoff.setHours(0, 0, 0, 0);
	cutoff.setDate(cutoff.getDate() - 99);

	const items = [];
	let totalCount = null;
	let incompleteResults = false;

	for (let page = 1; page <= MAX_COMMIT_PAGES; page += 1) {
		const response = await fetchJson(`${COMMIT_SEARCH_URL}&page=${page}`);
		const pageItems = Array.isArray(response.items) ? response.items : [];
		if (page === 1) totalCount = response.total_count;
		incompleteResults ||= Boolean(response.incomplete_results);
		items.push(...pageItems);

		const oldest = pageItems[pageItems.length - 1];
		const oldestDate = oldest ? new Date(getCommitDate(oldest)) : null;
		if (
			pageItems.length < 100 ||
			(oldestDate && !Number.isNaN(oldestDate.getTime()) && oldestDate < cutoff)
		) {
			break;
		}
	}

	return {
		total_count: totalCount,
		incomplete_results: incompleteResults,
		items,
	};
}

function readCache() {
	try {
		const cached = localStorage.getItem(CACHE_KEY);
		if (!cached) return null;
		const parsed = JSON.parse(cached);
		if (Date.now() - parsed.fetchedAt > CACHE_TTL) return null;
		return parsed;
	} catch {
		return null;
	}
}

function writeCache(data) {
	try {
		localStorage.setItem(CACHE_KEY, JSON.stringify(data));
	} catch {
		// The live page remains usable when storage is blocked.
	}
}

async function fetchDashboardData() {
	const names = [...Object.keys(ENDPOINTS), "commits"];
	const results = await Promise.allSettled(
		names.map((name) =>
			name === "commits" ? fetchCommitHistory() : fetchJson(ENDPOINTS[name]),
		),
	);
	const responses = Object.fromEntries(
		names.map((name, index) => [name, results[index]]),
	);

	if (responses.profile.status !== "fulfilled") throw responses.profile.reason;
	if (responses.repositories.status !== "fulfilled")
		throw responses.repositories.reason;

	const warnings = [];
	if (responses.commits.status !== "fulfilled") warnings.push("commits");

	const data = {
		profile: responses.profile.value,
		repositories: Array.isArray(responses.repositories.value)
			? responses.repositories.value
			: [],
		commits:
			responses.commits.status === "fulfilled"
				? responses.commits.value
				: { total_count: null, incomplete_results: false, items: [] },
		warnings,
		fetchedAt: Date.now(),
	};

	writeCache(data);
	return data;
}

function renderProfile(data) {
	const { profile, repositories, commits } = data;
	const ownedRepositories = repositories.filter(
		(repository) => !repository.fork,
	);
	const totalStars = ownedRepositories.reduce(
		(total, repository) => total + (repository.stargazers_count || 0),
		0,
	);
	const totalForks = ownedRepositories.reduce(
		(total, repository) => total + (repository.forks_count || 0),
		0,
	);
	const profileYear = new Date(profile.created_at).getFullYear();

	setText("[data-profile-handle]", `@${profile.login}`);
	setText("[data-profile-since]", `on GitHub since ${profileYear}`);
	setText("[data-total-commits]", formatNumber(commits.total_count));
	setText("[data-public-repos]", formatNumber(profile.public_repos));
	setText("[data-total-stars]", formatNumber(totalStars));
	setText("[data-total-forks]", formatNumber(totalForks));
	setText("[data-followers]", formatNumber(profile.followers));
	setText(
		"[data-dashboard-updated]",
		`Updated ${formatRelativeTime(data.fetchedAt)}`,
	);

	const avatar = query("[data-profile-avatar]");
	if (avatar instanceof HTMLImageElement) {
		avatar.src = profile.avatar_url;
		avatar.alt = `${profile.name || profile.login}'s GitHub avatar`;
	}

	const profileLinks = document.querySelectorAll("[data-profile-link]");
	for (const link of profileLinks) {
		if (link instanceof HTMLAnchorElement) link.href = profile.html_url;
	}
}

function renderCommitField(commitSearch) {
	const grid = query("[data-commit-grid]");
	const commits = Array.isArray(commitSearch.items) ? commitSearch.items : [];
	if (!grid) return;

	const today = new Date();
	today.setHours(12, 0, 0, 0);
	const days = Array.from({ length: 100 }, (_, index) => {
		const date = new Date(today);
		date.setDate(today.getDate() - (99 - index));
		return { date, key: localDateKey(date), commits: [] };
	});
	const daysByKey = new Map(days.map((day) => [day.key, day]));

	for (const commit of commits) {
		const day = daysByKey.get(localDateKey(getCommitDate(commit)));
		if (day) day.commits.push(commit);
	}

	const maxCommits = Math.max(1, ...days.map((day) => day.commits.length));
	const activeDays = days.filter((day) => day.commits.length > 0).length;
	const windowCommits = days.reduce(
		(total, day) => total + day.commits.length,
		0,
	);
	const fragment = document.createDocumentFragment();
	for (const day of days) {
		const count = day.commits.length;
		const level = getIntensityLevel(count, maxCommits);
		const cell = document.createElement("button");
		cell.type = "button";
		cell.className = `commit-pixel commit-pixel--level-${level}`;
		cell.setAttribute("aria-haspopup", "dialog");
		cell.setAttribute("aria-controls", "commit-day-details");
		cell.setAttribute("aria-expanded", "false");
		cell.setAttribute(
			"aria-label",
			`${formatDate(day.date)}, ${count} ${
				count === 1 ? "commit" : "commits"
			}.${isBirthday(day.date) ? " It was my birthday." : ""} Show details`,
		);
		cell.addEventListener("mouseenter", () => showCommitPopover(day, cell));
		cell.addEventListener("mouseleave", scheduleCommitPopoverHide);
		cell.addEventListener("focus", () => showCommitPopover(day, cell));
		cell.addEventListener("blur", scheduleCommitPopoverHide);
		cell.addEventListener("click", () => showCommitPopover(day, cell));
		cell.addEventListener("keydown", (event) => {
			if (event.key !== "Enter" || !day.commits.length) return;
			event.preventDefault();
			showCommitPopover(day, cell);
			requestAnimationFrame(() => {
				const link = query("[data-commit-popover-link]");
				if (link instanceof HTMLAnchorElement) link.focus();
			});
		});
		fragment.append(cell);
	}

	grid.replaceChildren(fragment);
	grid.setAttribute("aria-busy", "false");

	const newest = commits[0];
	setText(
		"[data-commit-range]",
		`${formatDate(days[0].date, compactDateFormatter)} to ${formatDate(
			days[days.length - 1].date,
			compactDateFormatter,
		)}`,
	);
	setText(
		"[data-commit-sample]",
		`${activeDays} active days / ${windowCommits} commits`,
	);

	if (!newest) {
		setText("[data-head-sha]", "-------");
		setText(
			"[data-head-message]",
			"GitHub's commit index is taking a breather.",
		);
		setText("[data-head-repository]", "Public commit search unavailable");
		setText("[data-head-date]", "Try again shortly");
		return;
	}

	const headLink = query("[data-head-link]");
	const repositoryLink = query("[data-head-repository]");
	const date = getCommitDate(newest);
	setText("[data-head-sha]", newest.sha.slice(0, 7));
	setText("[data-head-message]", getCommitMessage(newest));
	setText("[data-head-repository]", getRepositoryName(newest));
	setText(
		"[data-head-date]",
		`${formatRelativeTime(date)} / ${formatDate(date)}`,
	);
	if (headLink instanceof HTMLAnchorElement) headLink.href = newest.html_url;
	if (repositoryLink instanceof HTMLAnchorElement) {
		repositoryLink.href =
			newest.repository?.html_url ||
			`https://github.com/${getRepositoryName(newest)}`;
	}
}

function renderPublicMonth(commitSearch) {
	const chart = query("[data-event-chart]");
	if (!chart) return;
	const commits = Array.isArray(commitSearch.items) ? commitSearch.items : [];

	const today = new Date();
	today.setHours(12, 0, 0, 0);
	const days = Array.from({ length: 30 }, (_, index) => {
		const date = new Date(today);
		date.setDate(today.getDate() - (29 - index));
		return { date, key: localDateKey(date), count: 0 };
	});
	const counts = new Map(days.map((day) => [day.key, day]));

	for (const commit of commits) {
		const day = counts.get(localDateKey(getCommitDate(commit)));
		if (day) {
			day.count += 1;
			if (!day.commits) day.commits = [];
			day.commits.push(commit);
		}
	}

	const max = Math.max(1, ...days.map((day) => day.count));
	const fragment = document.createDocumentFragment();
	for (const [index, day] of days.entries()) {
		const column = document.createElement("button");
		const track = document.createElement("span");
		const bar = document.createElement("span");
		const count = document.createElement("span");
		const label = document.createElement("span");
		column.type = "button";
		column.className = "event-column";
		column.setAttribute("aria-pressed", "false");
		column.style.setProperty(
			"--event-height",
			`${Math.max(5, (day.count / max) * 100)}%`,
		);
		track.className = "event-bar-track";
		bar.className = `event-bar activity-level-${getIntensityLevel(
			day.count,
			max,
		)}`;
		column.setAttribute(
			"aria-label",
			`${formatDate(day.date, compactDateFormatter)}, ${day.count} public ${
				day.count === 1 ? "commit" : "commits"
			}`,
		);
		count.className = "event-count";
		count.setAttribute("aria-hidden", "true");
		count.textContent = `${day.count} ${
			day.count === 1 ? "commit" : "commits"
		}`;
		label.className = "event-date";
		label.textContent =
			index % 7 === 1 || index === 29 ? String(day.date.getDate()) : "";
		track.append(bar, count);
		column.append(track, label);
		bindMonthlyBar(column);
		fragment.append(column);
	}
	chart.replaceChildren(fragment);
	chart.setAttribute("aria-busy", "false");

	const monthlyCommits = days.reduce((total, day) => total + day.count, 0);
	const activeDays = days.filter((day) => day.count > 0);
	const busiestDay = activeDays.reduce(
		(busiest, day) => (!busiest || day.count > busiest.count ? day : busiest),
		null,
	);
	const repositories = new Set(
		activeDays.flatMap((day) =>
			(day.commits || []).map((commit) => getRepositoryName(commit)),
		),
	);
	let verdict = "didn't do much";
	if (monthlyCommits >= 20 && monthlyCommits <= 40) {
		verdict = "got some stuff done";
	} else if (monthlyCommits > 40 && monthlyCommits <= 60) {
		verdict = "had a lot to work on";
	} else if (monthlyCommits > 60) {
		verdict = "built more than I could keep count";
	}

	setText(
		"[data-month-note]",
		`${verdict} (${formatNumber(monthlyCommits)} ${
			monthlyCommits === 1 ? "commit" : "commits"
		})`,
	);
	setText("[data-month-commits]", formatNumber(monthlyCommits));
	setText("[data-month-active-days]", formatNumber(activeDays.length));
	setText(
		"[data-month-busiest]",
		busiestDay
			? `${formatDate(busiestDay.date, compactDateFormatter)} / ${
					busiestDay.count
				}`
			: "quiet",
	);
	setText("[data-month-repositories]", formatNumber(repositories.size));
}

function renderCommitRhythm(commitSearch) {
	const commits = Array.isArray(commitSearch.items)
		? commitSearch.items.slice(0, 100)
		: [];
	const hours = Array(24).fill(0);
	const weekdays = Array(7).fill(0);

	for (const commit of commits) {
		const date = new Date(getCommitDate(commit));
		if (Number.isNaN(date.getTime())) continue;
		hours[date.getHours()] += 1;
		weekdays[(date.getDay() + 6) % 7] += 1;
	}

	const hourChart = query("[data-hour-chart]");
	if (hourChart) {
		const maxHour = Math.max(1, ...hours);
		const fragment = document.createDocumentFragment();
		for (const [hour, count] of hours.entries()) {
			const column = document.createElement("button");
			const bar = document.createElement("span");
			const label = document.createElement("span");
			column.type = "button";
			column.className = "hour-column";
			column.setAttribute("aria-pressed", "false");
			bar.className = "hour-bar";
			bar.style.setProperty(
				"--hour-height",
				`${Math.max(4, (count / maxHour) * 100)}%`,
			);
			bar.title = `${formatHour(hour)}: ${count} ${
				count === 1 ? "commit" : "commits"
			}`;
			column.setAttribute(
				"aria-label",
				`${formatHour(hour)}, ${count} ${count === 1 ? "commit" : "commits"}`,
			);
			label.className = "hour-label";
			label.textContent = hour % 6 === 0 ? String(hour).padStart(2, "0") : "";
			column.append(bar, label);
			bindRhythmButton(
				column,
				`${formatHour(hour)} · ${count} ${
					count === 1 ? "commit" : "commits"
				} · ${describeHour(hour, count)}`,
			);
			fragment.append(column);
		}
		hourChart.replaceChildren(fragment);
		hourChart.setAttribute("aria-busy", "false");
	}

	const weekdayChart = query("[data-weekday-chart]");
	if (weekdayChart) {
		const maxDay = Math.max(1, ...weekdays);
		const fragment = document.createDocumentFragment();
		for (const [index, count] of weekdays.entries()) {
			const row = document.createElement("button");
			const name = document.createElement("span");
			const track = document.createElement("span");
			const bar = document.createElement("span");
			const value = document.createElement("span");
			row.type = "button";
			row.className = "weekday-row";
			row.setAttribute("aria-pressed", "false");
			row.setAttribute(
				"aria-label",
				`${dayNames[index]}, ${count} ${count === 1 ? "commit" : "commits"}`,
			);
			name.className = "weekday-name";
			name.textContent = dayNames[index].slice(0, 3);
			track.className = "weekday-track";
			bar.className = "weekday-bar";
			bar.style.setProperty("--weekday-width", `${(count / maxDay) * 100}%`);
			value.className = "weekday-value";
			value.textContent = String(count);
			track.append(bar);
			row.append(name, track, value);
			bindRhythmButton(
				row,
				`${dayNames[index]} · ${count} ${
					count === 1 ? "commit" : "commits"
				} · ${describeWeekday(index, count)}`,
			);
			fragment.append(row);
		}
		weekdayChart.replaceChildren(fragment);
		weekdayChart.setAttribute("aria-busy", "false");
	}

	const peakHour = hours.indexOf(Math.max(...hours));
	const peakDay = weekdays.indexOf(Math.max(...weekdays));
	setText(
		"[data-rhythm-note]",
		commits.length
			? `mostly ${dayNames[peakDay].toLowerCase()}s around ${formatHour(
					peakHour,
				).toLowerCase()}`
			: "waiting for the next commit",
	);
}

function renderLanguages(repositories) {
	const list = query("[data-language-list]");
	if (!list) return;

	const languageCounts = repositories
		.filter(
			(repository) =>
				!repository.fork && !repository.archived && repository.language,
		)
		.reduce((counts, repository) => {
			counts[repository.language] = (counts[repository.language] || 0) + 1;
			return counts;
		}, {});
	const languages = Object.entries(languageCounts)
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
		.slice(0, 8);
	const max = Math.max(1, ...languages.map((language) => language.count));
	const fragment = document.createDocumentFragment();

	for (const [index, language] of languages.entries()) {
		const row = document.createElement("li");
		const rank = document.createElement("span");
		const content = document.createElement("span");
		const heading = document.createElement("span");
		const name = document.createElement("span");
		const count = document.createElement("span");
		const track = document.createElement("span");
		const bar = document.createElement("span");
		row.className = "language-row";
		rank.className = "language-rank";
		rank.textContent = String(index + 1).padStart(2, "0");
		content.className = "language-content";
		heading.className = "language-heading";
		name.className = "language-name";
		name.textContent = language.name;
		count.className = "language-count";
		count.textContent = `${language.count} ${
			language.count === 1 ? "repo" : "repos"
		}`;
		track.className = "language-track";
		bar.className = "language-bar";
		bar.style.setProperty(
			"--language-width",
			`${(language.count / max) * 100}%`,
		);
		bar.style.setProperty("--language-color", getLanguageColor(language.name));
		heading.append(name, count);
		track.append(bar);
		content.append(heading, track);
		row.append(rank, content);
		fragment.append(row);
	}
	list.replaceChildren(fragment);
	list.setAttribute("aria-busy", "false");
	setText(
		"[data-language-note]",
		languages.length
			? `${languages[0].name.toLowerCase()} keeps winning`
			: "language pending",
	);
}

function renderRepositories(repositories) {
	const list = query("[data-repository-list]");
	if (!list) return;

	const featured = repositories
		.filter(
			(repository) =>
				!repository.fork &&
				!repository.archived &&
				repository.name !== USERNAME &&
				repository.description,
		)
		.sort((a, b) => {
			if (b.stargazers_count !== a.stargazers_count) {
				return b.stargazers_count - a.stargazers_count;
			}
			if (b.forks_count !== a.forks_count) return b.forks_count - a.forks_count;
			return new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime();
		})
		.slice(0, 5);
	const fragment = document.createDocumentFragment();

	for (const [index, repository] of featured.entries()) {
		const item = document.createElement("li");
		const link = document.createElement("a");
		const rank = document.createElement("span");
		const copy = document.createElement("span");
		const title = document.createElement("strong");
		const description = document.createElement("span");
		const facts = document.createElement("span");
		const language = document.createElement("span");
		const stars = document.createElement("span");
		const updated = document.createElement("span");
		const arrow = document.createElement("span");

		item.className = "repository-item";
		link.className = "repository-link";
		link.href = repository.html_url;
		link.target = "_blank";
		link.rel = "noopener noreferrer";
		rank.className = "repository-rank";
		rank.textContent = String(index + 1).padStart(2, "0");
		copy.className = "repository-copy";
		title.className = "repository-name";
		title.textContent = repository.name;
		description.className = "repository-description";
		description.textContent = repository.description || "Public repository.";
		facts.className = "repository-facts";
		language.className = "repository-language";
		language.textContent = repository.language || "Mixed";
		stars.textContent = `${formatNumber(repository.stargazers_count)} stars`;
		updated.textContent = `pushed ${formatRelativeTime(repository.pushed_at)}`;
		arrow.className = "repository-arrow";
		arrow.setAttribute("aria-hidden", "true");
		arrow.textContent = "↗";

		facts.append(language, stars, updated);
		copy.append(title, description);
		link.append(rank, copy, facts, arrow);
		item.append(link);
		fragment.append(item);
	}
	list.replaceChildren(fragment);
	list.setAttribute("aria-busy", "false");
}

function renderCommitLog(commitSearch) {
	const list = query("[data-commit-list]");
	if (!list) return;
	const commits = Array.isArray(commitSearch.items)
		? commitSearch.items.slice(0, 10)
		: [];
	const fragment = document.createDocumentFragment();

	for (const commit of commits) {
		const item = document.createElement("li");
		const link = document.createElement("a");
		const sha = document.createElement("code");
		const copy = document.createElement("span");
		const message = document.createElement("strong");
		const repository = document.createElement("span");
		const date = document.createElement("time");
		const arrow = document.createElement("span");
		const commitDate = getCommitDate(commit);

		item.className = "commit-log-item";
		link.className = "commit-log-link";
		link.href = commit.html_url;
		link.target = "_blank";
		link.rel = "noopener noreferrer";
		sha.className = "commit-log-sha";
		sha.textContent = commit.sha.slice(0, 7);
		copy.className = "commit-log-copy";
		message.className = "commit-log-message";
		message.textContent = getCommitMessage(commit);
		repository.className = "commit-log-repository";
		repository.textContent = stripOwner(getRepositoryName(commit));
		date.className = "commit-log-date";
		date.dateTime = commitDate || "";
		date.textContent = formatRelativeTime(commitDate);
		arrow.className = "commit-log-arrow";
		arrow.setAttribute("aria-hidden", "true");
		arrow.textContent = "↗";
		copy.append(message, repository);
		link.append(sha, copy, date, arrow);
		item.append(link);
		fragment.append(item);
	}
	list.replaceChildren(fragment);
	list.setAttribute("aria-busy", "false");
	setText(
		"[data-commit-log-count]",
		commits.length ? "fresh from git" : "Commit search unavailable",
	);
}

function renderWarnings(warnings) {
	const note = query("[data-api-note]");
	if (!note) return;
	if (!warnings.length) {
		note.hidden = true;
		return;
	}

	note.textContent =
		"GitHub's commit search is taking a breather. Everything else is still live.";
	note.hidden = false;
}

function renderDashboard(data) {
	renderProfile(data);
	renderCommitField(data.commits);
	renderPublicMonth(data.commits);
	renderCommitRhythm(data.commits);
	renderLanguages(data.repositories);
	renderRepositories(data.repositories);
	renderCommitLog(data.commits);
	renderWarnings(data.warnings || []);
}

function showError(error) {
	const alert = query("[data-dashboard-error]");
	const message = query("[data-dashboard-error-message]");
	if (message) {
		message.textContent =
			error instanceof Error && error.message === "rate-limit"
				? "GitHub's public rate limit is resting. The cached trail will return shortly."
				: "GitHub is being quiet right now. The profile itself is still one click away.";
	}
	if (alert) alert.hidden = false;
}

async function initDashboard({ force = false } = {}) {
	const dashboard = query("[data-github-dashboard]");
	if (!dashboard) return;
	dashboard.dataset.state = "loading";
	dashboard.setAttribute("aria-busy", "true");

	const alert = query("[data-dashboard-error]");
	if (alert) alert.hidden = true;

	try {
		const cached = force ? null : readCache();
		const data = cached || (await fetchDashboardData());
		renderDashboard(data);
		dashboard.dataset.state = "ready";
	} catch (error) {
		showError(error);
		dashboard.dataset.state = "error";
	} finally {
		dashboard.setAttribute("aria-busy", "false");
	}
}

const retryButton = query("[data-dashboard-retry]");
if (retryButton instanceof HTMLButtonElement) {
	retryButton.addEventListener("click", () => {
		try {
			localStorage.removeItem(CACHE_KEY);
		} catch {
			// Retry can still proceed without storage access.
		}
		initDashboard({ force: true });
	});
}

const commitPopover = query("[data-commit-popover]");
if (commitPopover instanceof HTMLElement) {
	commitPopover.addEventListener("mouseenter", clearPopoverTimers);
	commitPopover.addEventListener("mouseleave", scheduleCommitPopoverHide);
	commitPopover.addEventListener("focusin", clearPopoverTimers);
	commitPopover.addEventListener("focusout", scheduleCommitPopoverHide);
}

document.addEventListener("pointerdown", (event) => {
	if (!(event.target instanceof Element)) return;
	if (!event.target.closest("[data-event-chart] .event-column")) {
		clearMonthlyBarSelection();
	}
	if (
		event.target.closest("[data-commit-popover]") ||
		event.target.closest(".commit-pixel")
	)
		return;
	hideCommitPopover();
});

document.addEventListener("keydown", (event) => {
	if (event.key === "Escape") {
		clearMonthlyBarSelection();
		hideCommitPopover({ immediate: true });
	}
});

window.addEventListener("resize", () => hideCommitPopover({ immediate: true }));
window.addEventListener(
	"scroll",
	() => hideCommitPopover({ immediate: true }),
	{
		passive: true,
	},
);

initDashboard();
