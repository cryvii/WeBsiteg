<script lang="ts">
  import SeasonalDecoration from '$lib/components/SeasonalDecoration.svelte';
  
  let loading = false;
  let message = '';
  let error = '';
  let selectedFiles: File[] = [];

  async function handleSubmit(event: SubmitEvent) {
    loading = true;
    message = '';
    error = '';
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    // Upload files if any
    let referenceImages: string[] = [];
    if (selectedFiles.length > 0) {
      for (const file of selectedFiles) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        
        try {
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: uploadFormData
          });
          
          if (uploadRes.ok) {
            const { url } = await uploadRes.json();
            referenceImages.push(url);
          }
        } catch (err) {
          console.error('File upload failed:', err);
        }
      }
    }

    const payload = Object.fromEntries(formData.entries());
    if (referenceImages.length > 0) {
      payload.reference_images = JSON.stringify(referenceImages);
    }

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
      selectedFiles = [];
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    selectedFiles = Array.from(input.files || []);
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

          <div>
            <label for="reference_images" class="block font-bold mb-2 font-mono text-sm uppercase tracking-wider text-ink-light dark:text-dark-ink-dim">
              Reference Images (Optional)
            </label>
            <input 
              id="reference_images"
              name="reference_images" 
              type="file" 
              multiple
              accept="image/*"
              on:change={handleFileSelect}
              class="w-full border-2 border-ink-light dark:border-dark-ink-dim focus:border-ink dark:focus:border-dark-ink outline-none p-3 bg-transparent transition-colors file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-ink file:text-paper dark:file:bg-dark-ink dark:file:text-dark-bg cursor-pointer" 
            />
            {#if selectedFiles.length > 0}
              <p class="text-sm text-ink-light dark:text-dark-ink-dim mt-2">
                {selectedFiles.length} file(s) selected
              </p>
            {/if}
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
