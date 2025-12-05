<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  export let commissions: any[] = [];
  export let previewRange: { start: string; end: string } | null = null;
  const dispatch = createEventDispatcher();

  // Assign commission numbers (1-indexed)
  $: numberedCommissions = commissions.map((c, i) => ({
    ...c,
    commissionNumber: i + 1,
  }));

  let currentDate = new Date();

  onMount(() => {
    currentDate = new Date(); // Reset currentDate to today's date when the component mounts
  });

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  $: year = currentDate.getFullYear();
  $: month = currentDate.getMonth();
  $: firstDay = new Date(year, month, 1).getDay();
  $: daysInMonth = new Date(year, month + 1, 0).getDate();

  function isWeekend(day: number): boolean {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  function isInWorkRange(
    day: number,
    comms: any[],
    currentMonth: number,
    currentYear: number,
  ): boolean {
    if (isWeekend(day)) return false;

    for (const comm of comms) {
      // Skip completed and rejected commissions
      if (comm.status === "completed" || comm.status === "rejected") continue;
      if (!comm.accepted_at || !comm.completion_date) continue;

      // Parse dates - handle both date strings and Date objects
      // For date-only strings like "2025-12-16", parse directly to avoid timezone issues
      const acceptedStr =
        typeof comm.accepted_at === "string"
          ? comm.accepted_at.split("T")[0]
          : new Date(comm.accepted_at).toISOString().split("T")[0];
      const [aYear, aMonth, aDay] = acceptedStr.split("-").map(Number);
      const acceptedDate = new Date(aYear, aMonth - 1, aDay);

      const dueStr =
        typeof comm.completion_date === "string"
          ? comm.completion_date.split("T")[0]
          : new Date(comm.completion_date).toISOString().split("T")[0];
      const [dYear, dMonth, dDay] = dueStr.split("-").map(Number);
      const dueDate = new Date(dYear, dMonth - 1, dDay);

      const cellDate = new Date(currentYear, currentMonth, day);

      if (cellDate >= acceptedDate && cellDate <= dueDate) {
        return true;
      }
    }
    return false;
  }

  function isInPreviewRange(
    day: number,
    currentMonth: number,
    currentYear: number,
  ): boolean {
    if (!previewRange || isWeekend(day)) return false;

    const start = new Date(previewRange.start);
    start.setHours(0, 0, 0, 0);

    const end = new Date(previewRange.end);
    end.setHours(0, 0, 0, 0);

    const cellDate = new Date(currentYear, currentMonth, day);
    cellDate.setHours(0, 0, 0, 0);

    return cellDate >= start && cellDate <= end;
  }

  function getEventsForDay(
    day: number,
    comms: any[],
    currentMonth: number,
    currentYear: number,
  ) {
    return comms.filter((c) => {
      // Skip completed and rejected commissions
      if (c.status === "completed" || c.status === "rejected") return false;
      const date = new Date(c.created_at);
      return (
        date.getDate() === day &&
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      );
    });
  }

  function getAcceptedEventsForDay(
    day: number,
    comms: any[],
    currentMonth: number,
    currentYear: number,
  ) {
    return comms.filter((c) => {
      // Skip completed and rejected commissions
      if (c.status === "completed" || c.status === "rejected") return false;
      if (!c.accepted_at) return false;
      const date = new Date(c.accepted_at);
      return (
        date.getDate() === day &&
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      );
    });
  }

  function getCompletionEventsForDay(
    day: number,
    comms: any[],
    currentMonth: number,
    currentYear: number,
  ) {
    return comms.filter((c) => {
      // Skip completed and rejected commissions
      if (c.status === "completed" || c.status === "rejected") return false;
      if (!c.completion_date) return false;

      // Parse date string to avoid timezone issues
      const dateStr =
        typeof c.completion_date === "string"
          ? c.completion_date.split("T")[0]
          : new Date(c.completion_date).toISOString().split("T")[0];
      const [y, m, d] = dateStr.split("-").map(Number);

      return d === day && m - 1 === currentMonth && y === currentYear;
    });
  }

  function getScheduledEventsForDay(
    day: number,
    comms: any[],
    currentMonth: number,
    currentYear: number,
  ) {
    return comms.filter((c) => {
      if (!c.scheduled_at) return false;
      const date = new Date(c.scheduled_at);
      return (
        date.getDate() === day &&
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      );
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
    dispatch("dayClick", { date: clicked.toISOString() });
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
      {@const received = getEventsForDay(day, numberedCommissions, month, year)}
      {@const accepted = getAcceptedEventsForDay(
        day,
        numberedCommissions,
        month,
        year,
      )}
      {@const completion = getCompletionEventsForDay(
        day,
        numberedCommissions,
        month,
        year,
      )}
      {@const inWorkRange = isInWorkRange(
        day,
        numberedCommissions,
        month,
        year,
      )}
      {@const inPreview = isInPreviewRange(day, month, year)}

      <div
        on:click={() => onDayClick(day)}
        class={inPreview
          ? "bg-purple-900/40 rounded p-2 min-h-24 overflow-y-auto border-2 border-purple-500/70 cursor-pointer relative shadow-[0_0_10px_rgba(168,85,247,0.2)]"
          : inWorkRange
            ? "bg-blue-900/30 rounded p-2 min-h-24 overflow-y-auto border-2 border-blue-500/50 cursor-pointer relative"
            : "bg-slate-700 rounded p-2 min-h-24 overflow-y-auto border border-slate-600 cursor-pointer relative"}
      >
        <div class="font-bold text-white mb-1">{day}</div>

        <!-- Symbols as numbered circles -->
        <div class="flex flex-wrap gap-1 mt-auto pt-1">
          {#each received as comm}
            <div
              class="w-6 h-6 rounded-full bg-yellow-500 text-slate-900 text-xs font-bold flex items-center justify-center"
              title="Request #{comm.commissionNumber} received"
            >
              {comm.commissionNumber}
            </div>
          {/each}

          {#each accepted as comm}
            <div
              class="w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center"
              title="Commission #{comm.commissionNumber} accepted"
            >
              {comm.commissionNumber}
            </div>
          {/each}

          {#each completion as comm}
            <div
              class="w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center"
              title="Commission #{comm.commissionNumber} due"
            >
              {comm.commissionNumber}
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  <!-- Legend -->
  <div class="mt-6 flex gap-4 text-sm text-slate-300 flex-wrap">
    <div class="flex items-center gap-2">
      <div class="w-5 h-5 rounded-full bg-yellow-500"></div>
      <span>Request Received</span>
    </div>
    <div class="flex items-center gap-2">
      <div class="w-5 h-5 rounded-full bg-green-500"></div>
      <span>Accepted</span>
    </div>
    <div class="flex items-center gap-2">
      <div class="w-5 h-5 rounded-full bg-red-500"></div>
      <span>Due Date</span>
    </div>
    <div class="flex items-center gap-2">
      <div
        class="w-4 h-4 bg-blue-900/30 border-2 border-blue-500/50 rounded"
      ></div>
      <span>Work Period (Weekdays Only)</span>
    </div>
  </div>
</div>
