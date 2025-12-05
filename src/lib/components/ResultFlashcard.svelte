<script lang="ts">
    export let resultImages: string[] = [];
</script>

<div class="result-display">
    {#if resultImages && resultImages.length > 0}
        <div class="result-grid">
            {#each resultImages as img}
                <img src={img} alt="Final Result" class="result-image" />
            {/each}
        </div>
    {:else}
        <div class="empty-result">
            <p class="text-slate-500 text-sm">No final result uploaded</p>
        </div>
    {/if}
</div>

<style>
    .result-display {
        min-height: 200px;
        background: rgb(30 41 59); /* slate-800 */
        border-radius: 0.5rem;
        padding: 1rem;
        border: 1px solid rgb(51 65 85); /* slate-700 */
    }

    .result-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
    }

    .result-image {
        width: 100%;
        height: auto;
        max-height: 500px;
        object-fit: contain;
        border-radius: 0.375rem;
        border: 1px solid rgb(71 85 105);
        background: rgb(15 23 42); /* slate-900 */
    }

    .empty-result {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 200px;
    }
</style>
