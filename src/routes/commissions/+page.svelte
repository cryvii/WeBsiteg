<script lang="ts">
  import SeasonalDecoration from "$lib/components/SeasonalDecoration.svelte";

  let loading = false;
  let message = "";
  let error = "";
  let base64Images: string[] = []; // Store the actual base64 data to send
  let previewUrls: string[] = []; // Store data URLs for display (same as base64 usually)

  // Helper to compress image
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject("Canvas context not available");

          // Resize logic: max 1024px
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG 0.7 quality
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  async function handleSubmit(event: SubmitEvent) {
    loading = true;
    message = "";
    error = "";

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    // Attach processed base64 images
    // We send them as a JSON string inside the 'reference_images' field
    // The backend expects a JSON string of an array of strings
    if (base64Images.length > 0) {
      payload.reference_images = JSON.stringify(base64Images);
    } else {
      payload.reference_images = "[]";
    }

    try {
      const res = await fetch("/api/commission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Something went wrong");

      message = "Request sent! I will review it shortly.";
      form.reset();
      base64Images = [];
      previewUrls = [];
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  async function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    const newFiles = Array.from(input.files || []);

    if (base64Images.length + newFiles.length > 10) {
      alert("You can only upload a maximum of 10 images.");
      return;
    }

    loading = true; // Show loading while processing
    try {
      for (const file of newFiles) {
        const compressed = await compressImage(file);
        base64Images = [...base64Images, compressed];
        previewUrls = [...previewUrls, compressed];
      }
    } catch (err) {
      console.error("Image processing failed:", err);
      error = "Failed to process one or more images.";
    } finally {
      loading = false;
      input.value = "";
    }
  }

  function removeImage(index: number) {
    base64Images = base64Images.filter((_, i) => i !== index);
    previewUrls = previewUrls.filter((_, i) => i !== index);
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
      <div
        class="absolute -bottom-1 left-0 right-0 h-3 bg-accent opacity-20"
      ></div>
    </div>
    <p class="text-lg text-ink-light dark:text-dark-ink-dim leading-relaxed">
      I am currently accepting requests. <br />
      <strong class="text-ink dark:text-dark-ink">Rules:</strong> No AI. No Rush.
      Payment via Ko-fi.
    </p>
  </header>

  <main>
    <div
      class="paper p-8 shadow-brutal-lg dark:shadow-brutal-dark-lg transform rotate-1 relative"
    >
      <!-- Paper Clip Visual -->
      <div
        class="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-12 border-4 border-ink-light dark:border-dark-ink-dim rounded-full z-10 bg-transparent"
      ></div>

      <form on:submit|preventDefault={handleSubmit} class="space-y-6">
        <div>
          <label
            for="name"
            class="block font-bold mb-2 font-mono text-sm uppercase tracking-wider text-ink-light dark:text-dark-ink-dim"
          >
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
          <label
            for="email"
            class="block font-bold mb-2 font-mono text-sm uppercase tracking-wider text-ink-light dark:text-dark-ink-dim"
          >
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
          <label
            for="description"
            class="block font-bold mb-2 font-mono text-sm uppercase tracking-wider text-ink-light dark:text-dark-ink-dim"
          >
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
          <label
            for="reference_images"
            class="block font-bold mb-2 font-mono text-sm uppercase tracking-wider text-ink-light dark:text-dark-ink-dim"
          >
            Reference Images (Optional, Max 10)
          </label>

          <!-- Custom File Input -->
          <div
            class="relative border-2 border-dashed border-ink-light dark:border-dark-ink-dim hover:border-ink dark:hover:border-dark-ink transition-colors p-6 text-center cursor-pointer group"
          >
            <input
              id="reference_images"
              name="reference_images"
              type="file"
              multiple
              accept="image/*"
              on:change={handleFileSelect}
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={base64Images.length >= 10}
            />
            <div class="pointer-events-none">
              <p
                class="font-mono text-sm text-ink-light dark:text-dark-ink-dim group-hover:text-ink dark:group-hover:text-dark-ink"
              >
                {base64Images.length >= 10
                  ? "Limit Reached"
                  : "Click or Drag images here"}
              </p>
            </div>
          </div>

          <!-- Previews -->
          {#if previewUrls.length > 0}
            <div class="grid grid-cols-5 gap-2 mt-4">
              {#each previewUrls as url, i}
                <div class="relative aspect-square group">
                  <img
                    src={url}
                    alt="Preview"
                    class="w-full h-full object-cover rounded border border-ink-light dark:border-dark-ink-dim"
                  />
                  <button
                    type="button"
                    on:click={() => removeImage(i)}
                    class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  >
                    ×
                  </button>
                </div>
              {/each}
            </div>
            <p
              class="text-xs text-right mt-1 text-ink-light dark:text-dark-ink-dim font-mono"
            >
              {base64Images.length}/10
            </p>
          {/if}
        </div>

        <button
          type="submit"
          disabled={loading}
          class="w-full bg-ink dark:bg-dark-ink text-paper dark:text-dark-bg font-bold py-4 hover:opacity-90 disabled:opacity-50 transition-all uppercase tracking-widest shadow-brutal dark:shadow-brutal-dark hover:shadow-none hover:translate-x-1 hover:translate-y-1"
        >
          {loading ? "Transmitting..." : "Send Request"}
        </button>

        {#if message}
          <div
            class="p-4 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-2 border-green-500 text-center font-mono text-sm shadow-brutal dark:shadow-brutal-dark"
          >
            ✓ {message}
          </div>
        {/if}

        {#if error}
          <div
            class="p-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-2 border-red-500 text-center font-mono text-sm shadow-brutal dark:shadow-brutal-dark"
          >
            ✗ {error}
          </div>
        {/if}
      </form>
    </div>
  </main>
</div>
