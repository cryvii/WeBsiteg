<script lang="ts">
  import SeasonalDecoration from '$lib/components/SeasonalDecoration.svelte';
  
  let loading = false;
  let message = '';
  let error = '';

  async function handleSubmit(event: SubmitEvent) {
    loading = true;
    message = '';
    error = '';
    
    const form = event.target as HTMLFormElement;
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());

    try {
      const res = await fetch('/api/commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      
      if (!res.ok) throw new Error(result.error || 'Something went wrong');
      
      message = 'Request sent! I will review it shortly.';
      form.reset();
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen p-8 max-w-3xl mx-auto relative">
  <div class="absolute top-20 right-20 opacity-20 dark:opacity-10">
    <SeasonalDecoration name="stamp" />
  </div>

  <nav class="mb-12">
    <a 
      href="/" 
      class="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink-light dark:text-dark-ink-dim hover:text-ink dark:hover:text-dark-ink transition-colors"
    >
      <span>←</span> Back to Bunker
    </a>
  </nav>

  <header class="mb-12">
    <div class="inline-block relative mb-6">
      <h1 class="text-5xl font-bold tracking-tighter relative z-10">
        COMMISSIONS
      </h1>
      <div class="absolute -bottom-1 left-0 right-0 h-3 bg-accent opacity-20"></div>
    </div>
    <p class="text-lg text-ink-light dark:text-dark-ink-dim leading-relaxed">
      I am currently accepting requests. <br>
      <strong class="text-ink dark:text-dark-ink">Rules:</strong> No AI. No Rush. Payment via Ko-fi.
    </p>
  </header>

  <main>
    <div class="paper p-8 shadow-brutal-lg dark:shadow-brutal-dark-lg transform rotate-1 relative">
        <!-- Paper Clip Visual -->
        <div class="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-12 border-4 border-ink-light dark:border-dark-ink-dim rounded-full z-10 bg-transparent"></div>

        <form on:submit|preventDefault={handleSubmit} class="space-y-6">
          <div>
            <label for="name" class="block font-bold mb-2 font-mono text-sm uppercase tracking-wider text-ink-light dark:text-dark-ink-dim">
              Name / Alias
            </label>
            <input 
              id="name"
              name="name" 
              type="text" 
              class="input-underline w-full font-serif" 
              required 
            />
          </div>
          
          <div>
            <label for="email" class="block font-bold mb-2 font-mono text-sm uppercase tracking-wider text-ink-light dark:text-dark-ink-dim">
              Email
            </label>
            <input 
              id="email"
              name="email" 
              type="email" 
              class="input-underline w-full font-serif" 
              required 
            />
          </div>

          <div>
            <label for="description" class="block font-bold mb-2 font-mono text-sm uppercase tracking-wider text-ink-light dark:text-dark-ink-dim">
              Description
            </label>
            <textarea 
              id="description"
              name="description" 
              rows="6" 
              class="w-full border-2 border-ink-light dark:border-dark-ink-dim focus:border-ink dark:focus:border-dark-ink outline-none p-3 bg-transparent transition-colors font-serif resize-none" 
              placeholder="Describe your vision..."
              required
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            class="w-full bg-ink dark:bg-dark-ink text-paper dark:text-dark-bg font-bold py-4 hover:opacity-90 disabled:opacity-50 transition-all uppercase tracking-widest shadow-brutal dark:shadow-brutal-dark hover:shadow-none hover:translate-x-1 hover:translate-y-1"
          >
            {loading ? 'Transmitting...' : 'Send Request'}
          </button>

          {#if message}
            <div class="p-4 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-2 border-green-500 text-center font-mono text-sm shadow-brutal dark:shadow-brutal-dark">
              ✓ {message}
            </div>
          {/if}

          {#if error}
            <div class="p-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-2 border-red-500 text-center font-mono text-sm shadow-brutal dark:shadow-brutal-dark">
              ✗ {error}
            </div>
          {/if}
        </form>
      </div>
  </main>
</div>
