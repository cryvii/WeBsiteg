<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";

  let isDark = false;

  onMount(() => {
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    isDark = savedTheme === "dark" || (!savedTheme && prefersDark);
    applyTheme(isDark);
  });

  function applyTheme(dark: boolean) {
    if (browser) {
      if (dark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      localStorage.setItem("theme", dark ? "dark" : "light");
    }
  }

  function toggleTheme() {
    isDark = !isDark;
    applyTheme(isDark);
  }
</script>

<button
  on:click={toggleTheme}
  class="fixed bottom-6 right-6 z-50 p-3 paper shadow-brutal hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all group active:scale-95"
  aria-label="Toggle theme"
  title={isDark ? "Switch to light mode" : "Switch to dark mode"}
>
  <div class="relative w-6 h-6">
    <!-- Sun icon (light mode) -->
    <svg
      class="absolute inset-0 w-6 h-6 transition-all duration-500 ease-out {isDark
        ? 'opacity-0 rotate-180 scale-0'
        : 'opacity-100 rotate-0 scale-100'}"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="4" stroke-width="2" />
      <path
        stroke-width="2"
        d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41"
      />
    </svg>

    <!-- Moon icon (dark mode) -->
    <svg
      class="absolute inset-0 w-6 h-6 transition-all duration-500 ease-out {isDark
        ? 'opacity-100 rotate-0 scale-100'
        : 'opacity-0 -rotate-180 scale-0'}"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path
        stroke-width="2"
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      />
    </svg>
  </div>
</button>

<style>
  button {
    backdrop-filter: blur(10px);
  }

  button:hover {
    cursor: pointer;
  }
</style>
