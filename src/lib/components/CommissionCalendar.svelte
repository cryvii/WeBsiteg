<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let commissions: any[] = [];
  const dispatch = createEventDispatcher();

  let currentDate = new Date();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  $: year = currentDate.getFullYear();
  $: month = currentDate.getMonth();
  $: firstDay = new Date(year, month, 1).getDay();
  $: daysInMonth = new Date(year, month + 1, 0).getDate();

  function getDaysInMonth(y: number, m: number) {
    return new Date(y, m + 1, 0).getDate();
  }

  function getEventsForDay(day: number) {
    return commissions.filter(c => {
      const date = new Date(c.created_at);
      return date.getDate() === day && date.getMonth() === month && date.getFullYear() === year;
    });
  }

  function getAcceptedEventsForDay(day: number) {
    return commissions.filter(c => {
      if (!c.accepted_at) return false;
      const date = new Date(c.accepted_at);
      return date.getDate() === day && date.getMonth() === month && date.getFullYear() === year;
    });
  }

  function getCompletionEventsForDay(day: number) {
    return commissions.filter(c => {
      if (!c.completion_date) return false;
      const date = new Date(c.completion_date);
      return date.getDate() === day && date.getMonth() === month && date.getFullYear() === year;
    });
  }

  function getScheduledEventsForDay(day: number) {
    return commissions.filter(c => {
      if (!c.scheduled_at) return false;
      const date = new Date(c.scheduled_at);
      return date.getDate() === day && date.getMonth() === month && date.getFullYear() === year;
    });
  }

  function previousMonth() {
    currentDate = new Date(year, month - 1, 1);
  }

  function nextMonth() {
    currentDate = new Date(year, month + 1, 1);
  }

  function onDayClick(d: number) {
    const clicked = new Date(year, month, d);
    dispatch('dayClick', { date: clicked.toISOString() });
  }
</script>

<div class="bg-slate-800 rounded-lg p-6 border border-slate-700">
  <!-- Header -->
  <div class="flex justify-between items-center mb-6">
    <h2 class="text-2xl font-bold text-white">{monthNames[month]} {year}</h2>
    <div class="flex gap-2">
      <button
        on:click={previousMonth}
        class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition"
      >
        ← Previous
      </button>
      <button
        on:click={nextMonth}
        class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition"
      >
        Next →
      </button>
    </div>
  </div>

  <!-- Day headers -->
  <div class="grid grid-cols-7 gap-2 mb-2">
    {#each dayNames as day}
      <div class="text-center font-bold text-slate-400 py-2">{day}</div>
    {/each}
  </div>

  <!-- Calendar grid -->
  <div class="grid grid-cols-7 gap-2">
    <!-- Empty cells before first day -->
    {#each Array(firstDay) as _}
      <div class="bg-slate-700/30 rounded min-h-24"></div>
    {/each}

    <!-- Days -->
    {#each Array(daysInMonth) as _, i}
      {@const day = i + 1}
      {@const received = getEventsForDay(day)}
      {@const accepted = getAcceptedEventsForDay(day)}
      {@const completion = getCompletionEventsForDay(day)}
      {@const scheduled = getScheduledEventsForDay(day)}
      {#if (() => {
        // compute whether this cell is within the next 4 days (inclusive)
        const today = new Date();
        today.setHours(0,0,0,0);
        const cellDate = new Date(year, month, day);
        const diffDays = Math.ceil((cellDate.getTime() - today.getTime()) / (1000*60*60*24));
        return diffDays >= 0 && diffDays <= 4;
      })()}
        <div on:click={()=>onDayClick(day)} class="bg-slate-700 rounded p-2 min-h-24 overflow-y-auto border-2 border-yellow-500/40 cursor-pointer">
      {:else}
        <div on:click={()=>onDayClick(day)} class="bg-slate-700 rounded p-2 min-h-24 overflow-y-auto border border-slate-600 cursor-pointer">
      {/if}
        <div class="font-bold text-white mb-1">{day}</div>

        {#if received.length > 0}
          <div class="mb-1 text-xs bg-yellow-500/20 text-yellow-300 p-1 rounded">
            📨 {received.length} received
          </div>
        {/if}

        {#if accepted.length > 0}
          <div class="mb-1 text-xs bg-green-500/20 text-green-300 p-1 rounded">
            ✓ {accepted.length} accepted
          </div>
        {/if}

        {#if completion.length > 0}
          <div class="text-xs bg-blue-500/20 text-blue-300 p-1 rounded">
            🎯 {completion.length} due
          </div>
        {/if}

        {#if scheduled.length > 0}
          {#each scheduled as s}
            <div class="mt-1 text-xs bg-indigo-500/20 text-indigo-200 p-1 rounded">⏰ {new Date(s.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} — {s.client_name}</div>
          {/each}
        {/if}
      </div>
    {/each}
  </div>

  <!-- Legend -->
  <div class="mt-6 flex gap-4 text-sm text-slate-300">
    <div class="flex items-center gap-2">
      <span>📨</span>
      <span>Request Received</span>
    </div>
    <div class="flex items-center gap-2">
      <span>✓</span>
      <span>Commission Accepted</span>
    </div>
    <div class="flex items-center gap-2">
      <span>🎯</span>
      <span>Completion Due Date</span>
    </div>
  </div>
</div>
