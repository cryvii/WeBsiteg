<script lang="ts">
  import SeasonalDecoration from "$lib/components/SeasonalDecoration.svelte";
</script>

<div class="min-h-screen p-8 max-w-4xl mx-auto relative">
  <!-- Seasonal Decorations -->
  <div class="absolute top-20 right-20 opacity-30 dark:opacity-20">
    <SeasonalDecoration name="corner-doodle" />
  </div>

  <header class="mb-20 mt-16 text-center relative">
    <div class="inline-block relative">
      <h1 class="text-7xl font-bold mb-4 tracking-tighter relative z-10">
        THE BUNKER
      </h1>
      <div class="absolute -bottom-2 left-0 right-0 h-3 bg-accent opacity-20 -z-0"></div>
    </div>
    <p class="text-xl italic text-ink-light dark:text-dark-ink-dim font-serif mt-6">
      "Art made by human hands."
    </p>
  </header>

  <main class="space-y-24">
    <!-- INTRODUCTION -->
    <section class="max-w-2xl mx-auto text-center">
      <h2 class="text-xs font-bold uppercase tracking-widest mb-6 text-ink-light dark:text-dark-ink-dim">
        Transmission // 001
      </h2>
      <p class="text-lg leading-relaxed font-serif text-ink-light dark:text-dark-ink-dim">
        Welcome. I am a digital artist and writer focused on 
        <span class="bg-ink dark:bg-dark-ink text-paper dark:text-dark-bg px-2 py-1 font-bold">lo-fi aesthetics</span>
        and storytelling. This site is a self-hosted archive of my work, free from
        algorithms and infinite scrolling.
      </p>
    </section>

    <!-- WORKS / GALLERY -->
    <section>
      <div class="flex justify-between items-end mb-8 border-b-2 border-ink dark:border-dark-ink pb-2">
        <h2 class="text-3xl font-bold">RECENT WORKS</h2>
        <span class="font-mono text-xs text-ink-light dark:text-dark-ink-dim">ARCHIVE_2025</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Art Slot 1 -->
        <div class="group cursor-pointer">
          <div class="aspect-[4/5] paper p-2 shadow-brutal dark:shadow-brutal-dark transition-all group-hover:-translate-y-1 group-hover:shadow-brutal-lg dark:group-hover:shadow-brutal-dark-lg">
            <div class="w-full h-full bg-paper dark:bg-dark-bg flex items-center justify-center text-ink-light dark:text-dark-ink-dim italic border border-dashed border-ink-light dark:border-dark-ink-dim">
              [Scan_01.png]
            </div>
          </div>
          <p class="mt-3 font-bold font-mono text-sm">The Watcher</p>
        </div>

        <!-- Art Slot 2 -->
        <div class="group cursor-pointer md:mt-12">
          <div class="aspect-[4/5] paper p-2 shadow-brutal dark:shadow-brutal-dark transition-all group-hover:-translate-y-1 group-hover:shadow-brutal-lg dark:group-hover:shadow-brutal-dark-lg">
            <div class="w-full h-full bg-paper dark:bg-dark-bg flex items-center justify-center text-ink-light dark:text-dark-ink-dim italic border border-dashed border-ink-light dark:border-dark-ink-dim">
              [Scan_02.png]
            </div>
          </div>
          <p class="mt-3 font-bold font-mono text-sm">Static Noise</p>
        </div>

        <!-- Art Slot 3 -->
        <div class="group cursor-pointer">
          <div class="aspect-square paper p-2 shadow-brutal dark:shadow-brutal-dark transition-all group-hover:-translate-y-1 group-hover:shadow-brutal-lg dark:group-hover:shadow-brutal-dark-lg">
            <div class="w-full h-full bg-paper dark:bg-dark-bg flex items-center justify-center text-ink-light dark:text-dark-ink-dim italic border border-dashed border-ink-light dark:border-dark-ink-dim">
              [Scan_03.png]
            </div>
          </div>
          <p class="mt-3 font-bold font-mono text-sm">System Failure</p>
        </div>
      </div>
    </section>

    <!-- CALL TO ACTION -->
    <section class="text-center py-16 border-t-2 border-ink dark:border-dark-ink border-dashed">
      <p class="mb-8 font-serif text-lg text-ink-light dark:text-dark-ink-dim">
        Do you need a custom piece?
      </p>
      <a
        href="/commissions"
        class="inline-block bg-ink dark:bg-dark-ink text-paper dark:text-dark-bg px-8 py-4 font-bold text-xl uppercase tracking-wider shadow-brutal-lg dark:shadow-brutal-dark-lg hover:shadow-brutal dark:hover:shadow-brutal-dark hover:translate-x-1 hover:translate-y-1 transition-all"
      >
        Open Commissions
      </a>
    </section>
  </main>

  <footer class="mt-24 pt-8 border-t border-ink-light dark:border-dark-ink-dim text-center text-xs text-ink-light dark:text-dark-ink-dim font-mono">
    <p class="mb-2">NO_AI // NO_TRACKING // SELF_HOSTED</p>
    <p>&copy; 2025 The Seasonal Bunker.</p>
  </footer>
</div>
