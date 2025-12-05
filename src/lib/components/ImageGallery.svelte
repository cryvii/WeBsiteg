<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let images: string[] = [];
    export let initialIndex: number = 0;

    const dispatch = createEventDispatcher();

    let currentIndex = initialIndex;

    $: currentImage = images[currentIndex];
    $: hasNext = currentIndex < images.length - 1;
    $: hasPrev = currentIndex > 0;

    function close() {
        dispatch("close");
    }

    function next() {
        if (hasNext) {
            currentIndex++;
        }
    }

    function prev() {
        if (hasPrev) {
            currentIndex--;
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") close();
        if (e.key === "ArrowRight") next();
        if (e.key === "ArrowLeft") prev();
    }

    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) {
            close();
        }
    }
</script>

<svelte:window on:keydown={handleKeydown} />

<div
    class="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
    on:click={handleBackdropClick}
    role="dialog"
    aria-modal="true"
>
    <!-- Close Button -->
    <button
        on:click={close}
        class="absolute top-4 right-4 text-white hover:text-gray-300 transition z-10"
        aria-label="Close"
    >
        <svg
            class="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
            />
        </svg>
    </button>

    <!-- Previous Button -->
    {#if hasPrev}
        <button
            on:click={prev}
            class="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition bg-black/50 rounded-full p-3 hover:bg-black/70"
            aria-label="Previous image"
        >
            <svg
                class="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 19l-7-7 7-7"
                />
            </svg>
        </button>
    {/if}

    <!-- Image Container -->
    <div class="max-w-6xl max-h-[90vh] relative">
        <img
            src={currentImage}
            alt="Reference {currentIndex + 1} of {images.length}"
            class="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
        />

        <!-- Image Counter -->
        <div
            class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm"
        >
            {currentIndex + 1} / {images.length}
        </div>
    </div>

    <!-- Next Button -->
    {#if hasNext}
        <button
            on:click={next}
            class="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition bg-black/50 rounded-full p-3 hover:bg-black/70"
            aria-label="Next image"
        >
            <svg
                class="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                />
            </svg>
        </button>
    {/if}
</div>
