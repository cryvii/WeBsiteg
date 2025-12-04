<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import CommissionCalendar from '$lib/components/CommissionCalendar.svelte';

  let isLoggedIn = false;
  let username = '';
  let password = '';
  let loading = false;
  let error = '';
  let commissions: any[] = [];
  let activeTab = 'list'; // kept for backward compatibility but UI now shows both
  let emailTemplate = '';
  let showEmailPreview = false;
  let emailRecipient = '';
  // Scheduling modal state
  let showScheduleModal = false;
  let scheduleDateIso = '';
  let scheduleSelectedCommissionId: number | null = null;
  let scheduleTime = '12:00';

  onMount(async () => {
    // Check if already logged in
    const res = await fetch('/api/admin/check-auth');
    if (res.ok) {
      isLoggedIn = true;
      loadCommissions();
    }
  });

  async function handleLogin(e: SubmitEvent) {
    e.preventDefault();
    loading = true;
    error = '';

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        error = data.error || 'Login failed';
        loading = false;
        return;
      }

      isLoggedIn = true;
      loadCommissions();
    } catch (err: any) {
      error = err.message || 'Something went wrong';
      loading = false;
    }
  }

  async function loadCommissions() {
    const res = await fetch('/api/admin/commissions');
    if (res.ok) {
      commissions = await res.json();
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    isLoggedIn = false;
    username = '';
    password = '';
  }

  async function updateCommissionStatus(id: number, status: string, acceptedAt?: string, completionDate?: string) {
    const payload: any = { id, status };
    if (acceptedAt) payload.accepted_at = acceptedAt;
    if (completionDate) payload.completion_date = completionDate;
    // scheduled_at may be included by caller
    if ((payload as any).scheduled_at) payload.scheduled_at = (payload as any).scheduled_at;

    const res = await fetch('/api/admin/commissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      loadCommissions();
    }
  }

  async function handleAccept(commId: number) {
    const dueDateInput = document.getElementById(`due-date-${commId}`) as HTMLInputElement;
    const dueDate = dueDateInput?.value;
    const today = new Date().toISOString().split('T')[0]; // Today's date for acceptance
    updateCommissionStatus(commId, 'approved', today, dueDate);
  }

  async function handleReject(commId: number) {
    updateCommissionStatus(commId, 'rejected');
  }

  async function handleComplete(commId: number) {
    updateCommissionStatus(commId, 'completed');
  }

  async function handlePaid(commId: number) {
    updateCommissionStatus(commId, 'paid');
  }

  function formatDate(date: string | null) {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  }

  function generateAcceptanceEmail(comm: any) {
    const dueDate = comm.completion_date ? new Date(comm.completion_date).toLocaleDateString() : '[completion date]';
    const template = `Subject: Commission Accepted! 🎨

Dear ${comm.client_name},

Thank you for your commission request! I'm pleased to let you know that I've accepted your project.

Project Details:
- Description: ${comm.description}
- Estimated Completion: ${dueDate}

I'll work on this with care and attention to detail. If I have any questions, I'll reach out to you.

Looking forward to creating this for you!

Best regards,
[Your Name]`;
    return template;
  }

  function generateRejectionEmail(comm: any) {
    const template = `Subject: Commission Request - Status Update

Dear ${comm.client_name},

Thank you so much for your commission request. I appreciate your interest in my work!

Unfortunately, I'm unable to accept this project at this time due to my current workload and scheduling constraints. 

Feel free to reach out in the future, and I hope we can work together when the timing is right.

Best regards,
[Your Name]`;
    return template;
  }

  function openEmailTemplate(comm: any, type: 'accept' | 'reject') {
    emailRecipient = comm.email;
    emailTemplate = type === 'accept' ? generateAcceptanceEmail(comm) : generateRejectionEmail(comm);
    showEmailPreview = true;
  }

  function openGmailComposer() {
    const subject = emailTemplate.split('\n')[0].replace('Subject: ', '');
    const body = emailTemplate.split('\n').slice(2).join('\n');
    const gmailUrl = `https://mail.google.com/mail/u/0/?view=cm&to=${emailRecipient}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
    showEmailPreview = false;
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(emailTemplate);
    alert('Email template copied to clipboard!');
  }

  function handleAcceptWithEmail(commId: number) {
    const dueDateInput = document.getElementById(`due-date-${commId}`) as HTMLInputElement;
    if (!dueDateInput || !dueDateInput.value) {
      alert('Please select a completion date');
      return;
    }
    const comm = commissions.find(c => c.id === commId);
    if (comm) {
      const selectedDate = new Date(dueDateInput.value);
      const receivedDate = new Date(comm.created_at);
      
      if (selectedDate < receivedDate) {
        alert(`Completion date cannot be before the request date (${formatDate(comm.created_at)})`);
        return;
      }
      
      openEmailTemplate(comm, 'accept');
      handleAccept(commId);
    }
  }

  function getMinDate(createdAt: string): string {
    const date = new Date(createdAt);
    date.setDate(date.getDate() + 1); // Minimum 1 day after received
    return date.toISOString().split('T')[0];
  }

  // Called when calendar emits dayClick
  function onCalendarDayClick(evt: CustomEvent) {
    scheduleDateIso = evt.detail.date; // ISO date for the day clicked
    showScheduleModal = true;
    scheduleSelectedCommissionId = null;
    scheduleTime = '12:00';
  }

  function closeScheduleModal() {
    showScheduleModal = false;
  }

  async function confirmSchedule() {
    if (!scheduleSelectedCommissionId) {
      alert('Please select a commission to schedule');
      return;
    }

    // Build ISO datetime from clicked date and selected time
    const datePart = scheduleDateIso.split('T')[0];
    const iso = new Date(`${datePart}T${scheduleTime}:00`).toISOString();

    // update commission with scheduled_at; keep status as approved if currently pending
    const comm = commissions.find(c => c.id === scheduleSelectedCommissionId);
    const newStatus = comm && comm.status === 'pending' ? 'approved' : comm.status;

    const payload: any = { id: scheduleSelectedCommissionId, status: newStatus, scheduled_at: iso };

    const res = await fetch('/api/admin/commissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      closeScheduleModal();
      loadCommissions();
    } else {
      alert('Failed to schedule commission');
    }
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
  {#if !isLoggedIn}
    <!-- Login Page -->
    <div class="flex items-center justify-center min-h-screen p-4">
      <div class="w-full max-w-md bg-slate-800 rounded-lg shadow-xl p-8 border border-slate-700">
        <h1 class="text-3xl font-bold text-white mb-2">Admin Panel</h1>
        <p class="text-slate-400 mb-8">Commission Management</p>

        <form on:submit={handleLogin} class="space-y-4">
          <div>
            <label for="username" class="block text-sm font-medium text-slate-300 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              bind:value={username}
              required
              class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              bind:value={password}
              required
              class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
              placeholder="Enter password"
            />
          </div>

          {#if error}
            <div class="p-3 bg-red-500/10 border border-red-500 rounded text-red-400 text-sm">
              {error}
            </div>
          {/if}

          <button
            type="submit"
            disabled={loading}
            class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded transition"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  {:else}
    <!-- Dashboard -->
    <div class="p-8 min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 class="text-3xl sm:text-4xl font-bold text-white">Admin Dashboard</h1>
          <button
            on:click={handleLogout}
            class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition self-end sm:self-auto"
          >
            Logout
          </button>
        </div>
      </div>

      <!-- Two-column layout: list left, calendar right -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Left: List (span 7) -->
        <div class="lg:col-span-7 space-y-4">
          <!-- Commission List -->
          <div class="space-y-4">
          {#each commissions as comm (comm.id)}
            <div class="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h3 class="text-xl font-bold text-white">{comm.client_name}</h3>
                  <p class="text-slate-400 text-sm">{comm.email}</p>
                </div>
                <span class="px-3 py-1 rounded text-sm font-medium {comm.status === 'pending'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : comm.status === 'approved'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'}">
                  {comm.status.toUpperCase()}
                </span>
              </div>

              <p class="text-slate-300 mb-4">{comm.description}</p>

              <div class="grid grid-cols-3 gap-4 mb-4 text-sm">
                <div class="bg-slate-700 p-2 rounded">
                  <p class="text-slate-400">Received</p>
                  <p class="text-white font-medium">{formatDate(comm.created_at)}</p>
                </div>
                <div class="bg-slate-700 p-2 rounded">
                  <p class="text-slate-400">Accepted</p>
                  <p class="text-white font-medium">{formatDate(comm.accepted_at)}</p>
                </div>
                <div class="bg-slate-700 p-2 rounded">
                  <p class="text-slate-400">Due</p>
                  <p class="text-white font-medium">{formatDate(comm.completion_date)}</p>
                </div>
              </div>

              {#if comm.status === 'pending'}
                <div class="space-y-2">
                  <label class="block text-sm text-slate-300">
                    When will you complete this? (must be after {formatDate(comm.created_at)})
                  </label>
                  <input
                    type="date"
                    id="due-date-{comm.id}"
                    min={getMinDate(comm.created_at)}
                    class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
                    placeholder="Select completion date"
                  />
                  <div class="flex gap-2 mt-4">
                    <button
                      on:click={() => handleAcceptWithEmail(comm.id)}
                      class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition"
                    >
                      Accept & Preview Email
                    </button>
                    <button
                      on:click={() => openEmailTemplate(comm, 'reject')}
                      class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition"
                    >
                      Reject & Preview Email
                    </button>
                  </div>
                </div>
              {:else if comm.status === 'approved'}
                <div class="flex gap-2">
                  <button
                    on:click={() => handleComplete(comm.id)}
                    class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition"
                  >
                    Mark Completed
                  </button>
                  <button
                    on:click={() => handlePaid(comm.id)}
                    class="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium transition"
                  >
                    Mark Paid
                  </button>
                </div>
              {/if}
            </div>
          {/each}
            {#if commissions.length === 0}
              <div class="text-center py-12">
                <p class="text-slate-400 text-lg">No commissions yet.</p>
              </div>
            {/if}
          </div>
        </div>

        <!-- Right: Calendar (span 5) -->
        <div class="lg:col-span-5">
          <CommissionCalendar {commissions} on:dayClick={onCalendarDayClick} />
        </div>
      </div>


      <!-- Email Preview Modal -->
      {#if showEmailPreview}
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div class="bg-slate-800 rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-auto border border-slate-700">
            <h3 class="text-xl font-bold text-white mb-4">Email Preview</h3>
            
            <div class="bg-slate-700 p-4 rounded mb-4 whitespace-pre-wrap font-mono text-sm text-slate-300">
              {emailTemplate}
            </div>

            <div class="flex gap-3">
              <button
                on:click={openGmailComposer}
                class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition"
              >
                Open in Gmail →
              </button>
              <button
                on:click={copyToClipboard}
                class="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-medium transition"
              >
                Copy Template
              </button>
              <button
                on:click={() => showEmailPreview = false}
                class="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      {/if}

      <!-- Schedule Modal -->
      {#if showScheduleModal}
        <div class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div class="bg-slate-800 rounded-lg p-6 max-w-lg w-full border border-slate-700">
            <h3 class="text-lg font-bold text-white mb-2">Schedule work for {new Date(scheduleDateIso).toLocaleDateString()}</h3>

            <div class="mb-4">
              <label class="block text-sm text-slate-300 mb-1">Select commission</label>
              <select bind:value={scheduleSelectedCommissionId} class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white">
                <option value={null}>-- choose a commission --</option>
                {#each commissions as c}
                  <option value={c.id}>{c.client_name} — {c.email} {c.status === 'pending' ? '(pending)' : ''}</option>
                {/each}
              </select>
            </div>

            <div class="mb-4">
              <label class="block text-sm text-slate-300 mb-1">Time</label>
              <input type="time" bind:value={scheduleTime} class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white" />
            </div>

            <div class="flex gap-3">
              <button on:click={confirmSchedule} class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded">Confirm</button>
              <button on:click={closeScheduleModal} class="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded">Cancel</button>
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

