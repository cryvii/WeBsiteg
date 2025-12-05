<script lang="ts">
    import { createEventDispatcher } from "svelte";

    export let minDate: Date = new Date();
    export let selectedDate: Date | null = null;

    const dispatch = createEventDispatcher();

    let currentMonth = new Date();
    if (selectedDate) {
        currentMonth = new Date(selectedDate);
    }

    const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    $: year = currentMonth.getFullYear();
    $: month = currentMonth.getMonth();
    $: firstDay = new Date(year, month, 1).getDay();
    $: daysInMonth = new Date(year, month + 1, 0).getDate();

    function previousMonth() {
        currentMonth = new Date(year, month - 1, 1);
    }

    function nextMonth() {
        currentMonth = new Date(year, month + 1, 1);
    }

    function selectDate(day: number) {
        const date = new Date(year, month, day);
        if (isDateDisabled(day)) return;

        selectedDate = date;
        dispatch("select", date);
    }

    function isDateDisabled(day: number): boolean {
        const date = new Date(year, month, day);
        date.setHours(0, 0, 0, 0);
        const min = new Date(minDate);
        min.setHours(0, 0, 0, 0);
        return date <= min;
    }

    function isToday(day: number): boolean {
        const today = new Date();
        return (
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
        );
    }

    function isSelected(day: number): boolean {
        if (!selectedDate) return false;
        return (
            day === selectedDate.getDate() &&
            month === selectedDate.getMonth() &&
            year === selectedDate.getFullYear()
        );
    }
</script>

<div
    class="bg-slate-700 rounded-lg p-3 border border-slate-600 w-full max-w-sm"
>
    <!-- Header -->
    <div class="flex justify-between items-center mb-3">
        <button
            type="button"
            on:click={previousMonth}
            class="p-1 hover:bg-slate-600 rounded transition"
            aria-label="Previous month"
        >
            <svg
                class="w-5 h-5 text-white"
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
        <span class="text-white font-medium text-sm">
            {monthNames[month]}
            {year}
        </span>
        <button
            type="button"
            on:click={nextMonth}
            class="p-1 hover:bg-slate-600 rounded transition"
            aria-label="Next month"
        >
            <svg
                class="w-5 h-5 text-white"
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
    </div>

    <!-- Day headers -->
    <div class="grid grid-cols-7 gap-1 mb-1">
        {#each dayNames as day}
            <div class="text-center text-xs text-slate-400 py-1">
                {day.substring(0, 1)}
            </div>
        {/each}
    </div>

    <!-- Calendar days -->
    <div class="grid grid-cols-7 gap-1">
        <!-- Empty cells -->
        {#each Array(firstDay) as _}
            <div class="aspect-square"></div>
        {/each}

        <!-- Days -->
        {#each Array(daysInMonth) as _, i}
            {@const day = i + 1}
            {@const disabled = isDateDisabled(day)}
            {@const today = isToday(day)}
            {@const selected = isSelected(day)}

            <button
                type="button"
                on:click={() => selectDate(day)}
                {disabled}
                class="aspect-square flex items-center justify-center text-sm rounded transition
          {disabled
                    ? 'text-slate-500 cursor-not-allowed'
                    : 'text-white hover:bg-slate-600'}
          {selected ? 'bg-blue-600 hover:bg-blue-700 font-bold' : ''}
          {today && !selected ? 'border border-blue-400' : ''}"
            >
                {day}
            </button>
        {/each}
    </div>
</div>
