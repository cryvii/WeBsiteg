<script lang="ts">
  import { enhance } from '$app/forms';
  
  export let data;
  export let form;

  let subject = "Invoice for Commission";
  let body = "Hi,\n\nI am ready to start your commission. Please find the payment details below.\n\nPrice: $50\n\nThanks!";
</script>

<div class="min-h-screen p-8 max-w-5xl mx-auto">
  <header class="mb-12">
    <div class="inline-block relative">
      <h1 class="text-5xl font-bold tracking-tighter relative z-10">
        BUNKER ADMIN
      </h1>
      <div class="absolute -bottom-1 left-0 right-0 h-3 bg-accent opacity-20"></div>
    </div>
  </header>

  {#if !data.user}
    <!-- Login Form -->
    <div class="max-w-md mx-auto mt-20">
      <form method="POST" action="?/login" class="paper p-8 shadow-brutal-lg dark:shadow-brutal-dark-lg">
        <h2 class="text-2xl font-bold mb-6 text-center uppercase tracking-wider">Access Control</h2>
        
        <label class="block mb-6">
          <span class="block font-bold mb-2 font-mono text-sm uppercase tracking-wider text-ink-light dark:text-dark-ink-dim">
            Username
          </span>
          <input 
            name="username" 
            type="text" 
            class="input-underline w-full" 
            required 
          />
        </label>
        
        <label class="block mb-8">
          <span class="block font-bold mb-2 font-mono text-sm uppercase tracking-wider text-ink-light dark:text-dark-ink-dim">
            Password
          </span>
          <input 
            name="password" 
            type="password" 
            class="input-underline w-full" 
            required 
          />
        </label>
        
        <button class="w-full bg-ink dark:bg-dark-ink text-paper dark:text-dark-bg font-bold py-3 uppercase tracking-widest shadow-brutal dark:shadow-brutal-dark hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
          Enter Bunker
        </button>
        
        {#if form?.error}
          <p class="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-2 border-red-500 text-center font-mono text-sm">
            {form.error}
          </p>
        {/if}
      </form>
    </div>
  {:else}
    <!-- Dashboard -->
    <div class="paper p-6 shadow-brutal dark:shadow-brutal-dark mb-8">
      <div class="flex justify-between items-center">
        <div class="space-y-2">
          <p class="font-mono text-sm">
            <span class="text-ink-light dark:text-dark-ink-dim">Status:</span>
            <span class="font-bold ml-2 {data.settings.is_commissions_open ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
              {data.settings.is_commissions_open ? 'OPEN' : 'CLOSED'}
            </span>
          </p>
          <p class="font-mono text-sm">
            <span class="text-ink-light dark:text-dark-ink-dim">Queue:</span>
            <span class="font-bold ml-2">{data.pendingCount} / {data.settings.queue_limit}</span>
          </p>
        </div>
        <form method="POST" action="?/toggle">
          <button class="paper px-6 py-3 font-bold uppercase tracking-wider text-sm shadow-brutal dark:shadow-brutal-dark hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
            {data.settings.is_commissions_open ? 'Close' : 'Open'}
          </button>
        </form>
      </div>
    </div>

    <h2 class="text-3xl font-bold mb-6 uppercase tracking-tight">Pending Commissions</h2>
    <div class="space-y-6">
      {#each data.commissions as comm}
        <div class="paper p-6 shadow-brutal dark:shadow-brutal-dark">
          <div class="flex justify-between items-start mb-3">
            <h3 class="font-bold text-xl">{comm.client_name}</h3>
            <span class="text-xs font-mono text-ink-light dark:text-dark-ink-dim">
              {new Date(comm.created_at).toLocaleDateString()}
            </span>
          </div>
          <p class="text-sm text-ink-light dark:text-dark-ink-dim mb-4 font-mono">{comm.email}</p>
          <div class="bg-paper dark:bg-dark-bg p-4 mb-4 border-l-4 border-accent">
            <p class="text-sm font-serif leading-relaxed">{comm.description}</p>
          </div>
          
          <div class="flex gap-3">
            <a 
              href="mailto:{comm.email}?subject={encodeURIComponent(subject)}&body={encodeURIComponent(body)}"
              class="bg-ink dark:bg-dark-ink text-paper dark:text-dark-bg px-4 py-2 text-sm font-bold uppercase tracking-wider shadow-brutal dark:shadow-brutal-dark hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
            >
              Approve
            </a>
            <form method="POST" action="?/reject" use:enhance>
              <input type="hidden" name="id" value={comm.id} />
              <button class="paper px-4 py-2 text-sm font-bold uppercase tracking-wider text-red-600 dark:text-red-400 border-red-500 shadow-brutal dark:shadow-brutal-dark hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                Reject
              </button>
            </form>
          </div>
        </div>
      {/each}
      {#if data.commissions.length === 0}
        <div class="paper p-12 text-center">
          <p class="text-ink-light dark:text-dark-ink-dim italic text-lg">No pending commissions.</p>
        </div>
      {/if}
    </div>
  {/if}
</div>
