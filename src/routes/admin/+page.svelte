<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import CommissionCalendar from "$lib/components/CommissionCalendar.svelte";
  import ImageGallery from "$lib/components/ImageGallery.svelte";
  import DatePicker from "$lib/components/DatePicker.svelte";
  import ResultFlashcard from "$lib/components/ResultFlashcard.svelte";

  let isLoggedIn = false;
  let username = "";
  let password = "";
  let loading = false;
  let error = "";
  let commissions: any[] = [];
  let emailTemplate = "";
  let showEmailPreview = false;
  let emailRecipient = "";

  // Image gallery state
  let showImageGallery = false;
  let galleryImages: string[] = [];
  let galleryInitialIndex = 0;

  // Payment modal state
  let showPaymentModal = false;
  let paymentCommissionId: number | null = null;
  let paymentAmount = "";
  let paymentReference = "";

  // Delete confirmation modal state
  let showDeleteModal = false;
  let deleteCommissionId: number | null = null;

  // Result upload state
  let uploadingResultFor: number | null = null;

  // Flippable archives state
  let flippedCards: Set<number> = new Set();

  // Preview state
  let previewRange: { start: string; end: string } | null = null;
  let previewDays: number | null = null;
  let previewCommId: number | null = null;

  // Computed: Active vs Archived commissions
  $: activeCommissions = commissions.filter(
    (c) => c.status !== "completed" && c.status !== "rejected",
  );
  $: archivedCommissions = commissions
    .filter((c) => c.status === "completed" || c.status === "rejected")
    .sort((a, b) => {
      const dateA = a.completion_date
        ? new Date(a.completion_date).getTime()
        : new Date(a.created_at).getTime();
      const dateB = b.completion_date
        ? new Date(b.completion_date).getTime()
        : new Date(b.created_at).getTime();
      return dateB - dateA;
    });
  $: completedCount = commissions.filter(
    (c) => c.status === "completed",
  ).length;

  $: totalEarnings = commissions
    .filter((c) => c.status === "completed" && c.paid_amount)
    .reduce((sum, c) => sum + (c.paid_amount || 0), 0);

  onMount(async () => {
    const res = await fetch("/api/admin/check-auth");
    if (res.ok) {
      isLoggedIn = true;
      await loadCommissions();
    }
  });

  async function handleLogin(e: Event) {
    e.preventDefault();
    loading = true;
    error = "";

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        error = data.error || "Login failed";
        loading = false;
        return;
      }

      isLoggedIn = true;
      await loadCommissions();
    } catch (err) {
      error = "Network error";
      loading = false;
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    isLoggedIn = false;
    commissions = [];
    goto("/admin");
  }

  async function loadCommissions() {
    const res = await fetch("/api/admin/commissions");
    if (res.ok) {
      commissions = await res.json();
    }
  }

  async function updateCommissionStatus(
    id: number,
    status: string,
    acceptedAt?: string,
    dueDate?: string,
  ) {
    const body: any = { id, status };
    if (acceptedAt) body.accepted_at = acceptedAt;
    if (dueDate) body.completion_date = dueDate;

    const res = await fetch("/api/admin/commissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) await loadCommissions();
  }

  async function handleApprove(commId: number) {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const dueDate = previewRange?.end
      ? previewRange.end.split("T")[0]
      : undefined;
    await updateCommissionStatus(commId, "approved", today, dueDate);
  }

  async function handleComplete(commId: number) {
    await updateCommissionStatus(commId, "completed");
  }

  function openDeleteModal(commId: number) {
    deleteCommissionId = commId;
    showDeleteModal = true;
  }

  function closeDeleteModal() {
    showDeleteModal = false;
    deleteCommissionId = null;
  }

  async function confirmDelete() {
    if (!deleteCommissionId) return;
    const res = await fetch("/api/admin/commissions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteCommissionId }),
    });
    if (res.ok) await loadCommissions();
    closeDeleteModal();
  }

  function openPaymentModal(commId: number) {
    paymentCommissionId = commId;
    paymentAmount = "";
    paymentReference = "";
    showPaymentModal = true;
  }

  function closePaymentModal() {
    showPaymentModal = false;
    paymentCommissionId = null;
  }

  async function confirmPayment() {
    if (!paymentCommissionId || !paymentAmount) return;
    const amountInCents = Math.round(parseFloat(paymentAmount) * 100);

    const res = await fetch("/api/admin/commissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: paymentCommissionId,
        status: "paid",
        paid_amount: amountInCents,
        payment_reference: paymentReference,
      }),
    });

    if (res.ok) await loadCommissions();
    closePaymentModal();
  }

  function openImageGallery(images: string[], index: number) {
    galleryImages = images;
    galleryInitialIndex = index;
    showImageGallery = true;
  }

  async function handleResultDrop(commId: number, event: DragEvent) {
    event.preventDefault();
    const files = Array.from(event.dataTransfer?.files || []);
    if (files.length > 0) await uploadResultImages(commId, files);
  }

  function handleResultFileSelect(commId: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (files.length > 0) uploadResultImages(commId, files);
  }

  async function uploadResultImages(commId: number, files: File[]) {
    uploadingResultFor = commId;
    const formData = new FormData();
    formData.append("commission_id", commId.toString());
    files.forEach((file) => formData.append("images", file));

    try {
      const res = await fetch("/api/admin/upload-result", {
        method: "POST",
        body: formData,
      });
      if (res.ok) await loadCommissions();
      else alert("Failed to upload result images");
    } catch (err) {
      alert("Failed to upload result images");
    } finally {
      uploadingResultFor = null;
    }
  }

  function toggleCardFlip(commId: number) {
    if (flippedCards.has(commId)) {
      flippedCards.delete(commId);
    } else {
      flippedCards.add(commId);
    }
    flippedCards = flippedCards; // Trigger reactivity
  }

  function handleDatePreview(commId: number, dateStr: string) {
    if (!dateStr) {
      previewRange = null;
      previewDays = null;
      previewCommId = null;
      return;
    }

    const comm = commissions.find((c) => c.id === commId);
    if (!comm) return;

    const acceptedDate = new Date(comm.created_at);
    const dueDate = new Date(dateStr);
    const diffTime = Math.abs(dueDate.getTime() - acceptedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    previewRange = { start: comm.created_at, end: dateStr };
    previewDays = diffDays;
    previewCommId = commId;
  }

  function getMinDate(createdAt: string): string {
    const date = new Date(createdAt);
    date.setDate(date.getDate() + 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString();
  }

  function getDaysBetween(startStr: string, endStr: string): number {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
</script>

{#if !isLoggedIn}
  <!-- Login Screen -->
  <div
    class="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800"
  >
    <div
      class="w-full max-w-md p-8 bg-slate-800 rounded-lg shadow-xl border border-slate-700"
    >
      <h2 class="text-3xl font-bold text-white mb-6 text-center">
        Admin Login
      </h2>
      <form on:submit={handleLogin} class="space-y-4">
        {#if error}
          <div
            class="p-3 bg-red-500/20 border border-red-500 rounded text-red-200 text-sm"
          >
            {error}
          </div>
        {/if}
        <div>
          <label class="block text-slate-300 mb-2">Username</label>
          <input
            type="text"
            bind:value={username}
            required
            class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white"
          />
        </div>
        <div>
          <label class="block text-slate-300 mb-2">Password</label>
          <input
            type="password"
            bind:value={password}
            required
            class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          class="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded transition"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  </div>
{:else}
  <!-- Dashboard -->
  <div class="p-8 min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex justify-between items-center">
        <h1 class="text-4xl font-bold text-white">Admin Dashboard</h1>
        <button
          on:click={handleLogout}
          class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition"
        >
          Logout
        </button>
      </div>
    </div>

    <!-- Statistics Dashboard -->
    <div class="grid grid-cols-2 gap-6 mb-8">
      <div class="bg-green-600/20 border border-green-600/30 rounded-lg p-6">
        <div class="flex items-center gap-4">
          <div class="bg-green-600/30 p-3 rounded-full">
            <svg
              class="w-8 h-8 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p class="text-green-400 text-sm font-medium">
              Completed Commissions
            </p>
            <p class="text-white text-3xl font-bold">{completedCount}</p>
          </div>
        </div>
      </div>
      <div class="bg-blue-600/20 border border-blue-600/30 rounded-lg p-6">
        <div class="flex items-center gap-4">
          <div class="bg-blue-600/30 p-3 rounded-full">
            <svg
              class="w-8 h-8 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p class="text-blue-400 text-sm font-medium">Total Earnings</p>
            <p class="text-white text-3xl font-bold">
              €{(totalEarnings / 100).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Two-column layout -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Left: Commissions List -->
      <div class="space-y-8">
        <!-- Active Commissions -->
        <div>
          <h2 class="text-2xl font-bold text-white mb-4">Active Commissions</h2>
          {#if activeCommissions.length === 0}
            <p class="text-slate-400">No active commissions.</p>
          {:else}
            <div class="space-y-4">
              {#each activeCommissions as comm (comm.id)}
                <div
                  class="bg-slate-800 rounded-lg p-6 border border-slate-700"
                >
                  <div class="flex justify-between items-start mb-4">
                    <div>
                      <h3 class="text-xl font-bold text-white">
                        {comm.client_name}
                      </h3>
                      <p class="text-slate-400 text-sm">{comm.email}</p>
                    </div>
                    <span
                      class="px-3 py-1 rounded text-sm font-medium
                      {comm.status === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : comm.status === 'approved'
                          ? 'bg-blue-500/20 text-blue-400'
                          : comm.status === 'paid'
                            ? 'bg-purple-500/20 text-purple-400'
                            : ''}"
                    >
                      {comm.status.toUpperCase()}
                    </span>
                  </div>
                  <p class="text-slate-300 mb-4">{comm.description}</p>

                  <!-- Reference Images -->
                  {#if comm.reference_images && comm.reference_images !== "[]"}
                    <div class="mb-4">
                      <p class="text-slate-400 text-sm mb-2">
                        Reference Images:
                      </p>
                      <div class="flex flex-wrap gap-2">
                        {#each JSON.parse(comm.reference_images) as imgUrl, index}
                          <button
                            type="button"
                            on:click={() =>
                              openImageGallery(
                                JSON.parse(comm.reference_images),
                                index,
                              )}
                            class="block w-20 h-20 relative group cursor-pointer"
                          >
                            <img
                              src={imgUrl}
                              alt="Reference"
                              class="w-full h-full object-cover rounded border border-slate-600 group-hover:border-blue-500 transition-colors"
                            />
                          </button>
                        {/each}
                      </div>
                    </div>
                  {/if}

                  <!-- Date Picker for Approval -->
                  {#if comm.status === "pending"}
                    <div class="mb-4">
                      <p class="text-slate-400 text-sm mb-2">
                        Set Completion Date:
                      </p>
                      <DatePicker
                        minDate={getMinDate(comm.created_at)}
                        selectedDate={previewCommId === comm.id && previewRange
                          ? new Date(previewRange.end)
                          : null}
                        on:select={(e) => {
                          const date = e.detail;
                          const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                          handleDatePreview(comm.id, dateStr);
                        }}
                      />
                      {#if previewCommId === comm.id && previewDays}
                        <p class="text-blue-400 text-sm mt-2">
                          Duration: {previewDays} days
                        </p>
                      {/if}
                    </div>
                  {/if}

                  <!-- Action Buttons -->
                  <div class="flex gap-2 flex-wrap">
                    {#if comm.status === "pending"}
                      <button
                        on:click={() => handleApprove(comm.id)}
                        class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition"
                      >
                        Approve
                      </button>
                    {/if}
                    {#if comm.status === "approved" || comm.status === "paid"}
                      <button
                        on:click={() => handleComplete(comm.id)}
                        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition"
                      >
                        Mark Completed
                      </button>
                    {/if}
                    {#if comm.status === "approved" && !comm.paid_amount}
                      <button
                        on:click={() => openPaymentModal(comm.id)}
                        class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium transition"
                      >
                        Mark Paid
                      </button>
                    {/if}
                    {#if comm.paid_amount}
                      <div
                        class="px-4 py-2 bg-green-600/20 text-green-400 rounded font-medium"
                      >
                        Paid: €{(comm.paid_amount / 100).toFixed(2)}
                      </div>
                    {/if}
                  </div>

                  <!-- Date Info -->
                  <div class="grid grid-cols-3 gap-4 text-sm mt-4">
                    <div class="bg-slate-700 p-2 rounded">
                      <p class="text-slate-400">Received</p>
                      <p class="text-white font-medium">
                        {formatDate(comm.created_at)}
                      </p>
                    </div>
                    {#if comm.accepted_at}
                      <div class="bg-slate-700 p-2 rounded">
                        <p class="text-slate-400">Accepted</p>
                        <p class="text-white font-medium">
                          {formatDate(comm.accepted_at)}
                        </p>
                      </div>
                    {/if}
                    {#if comm.completion_date}
                      <div class="bg-slate-700 p-2 rounded">
                        <p class="text-slate-400">Due</p>
                        <p class="text-white font-medium">
                          {formatDate(comm.completion_date)}
                        </p>
                      </div>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Archives Section -->
        {#if archivedCommissions.length > 0}
          <div>
            <h2 class="text-2xl font-bold text-white mb-4">Archives</h2>
            <div class="space-y-4">
              {#each archivedCommissions as comm (comm.id)}
                {@const hasResults =
                  comm.final_result_images &&
                  JSON.parse(comm.final_result_images).length > 0}
                {@const isFlipped = flippedCards.has(comm.id)}

                <!-- Flippable Card Container -->
                <div
                  class="flip-container {isFlipped ? 'z-50 relative' : ''}"
                  style="perspective: 1000px;"
                >
                  <div
                    class="flip-card"
                    class:flipped={isFlipped}
                    style="transform-style: preserve-3d; transition: transform 0.6s;"
                  >
                    <!-- FRONT: Commission Info -->
                    <div
                      class="flip-face front"
                      style="backface-visibility: hidden;"
                    >
                      <div
                        class="bg-slate-800 rounded-lg p-6 border border-slate-700 opacity-75"
                      >
                        <div class="flex justify-between items-start mb-4">
                          <div>
                            <h3 class="text-xl font-bold text-white">
                              {comm.client_name}
                            </h3>
                            <p class="text-slate-400 text-sm">{comm.email}</p>
                          </div>
                          <div class="flex flex-col items-end gap-2">
                            <span
                              class="px-3 py-1 rounded text-sm font-medium
                              {comm.status === 'completed'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'}"
                            >
                              {comm.status.toUpperCase()}
                            </span>
                            {#if comm.paid_amount}
                              <p class="text-green-400 font-bold text-2xl">
                                €{(comm.paid_amount / 100).toFixed(2)}
                              </p>
                            {/if}
                            {#if comm.accepted_at && comm.completion_date}
                              <p class="text-blue-400 text-lg font-semibold">
                                {getDaysBetween(
                                  comm.accepted_at,
                                  comm.completion_date,
                                )} days
                              </p>
                            {/if}
                            <button
                              on:click={() => openDeleteModal(comm.id)}
                              class="mt-2 px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-xs font-medium transition"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <p class="text-slate-300 mb-4">{comm.description}</p>

                        <!-- Reference Images -->
                        {#if comm.reference_images && comm.reference_images !== "[]"}
                          <div class="mb-4">
                            <p class="text-slate-400 text-sm mb-2">
                              Reference Images:
                            </p>
                            <div class="flex flex-wrap gap-2">
                              {#each JSON.parse(comm.reference_images) as imgUrl, index}
                                <button
                                  type="button"
                                  on:click={() =>
                                    openImageGallery(
                                      JSON.parse(comm.reference_images),
                                      index,
                                    )}
                                  class="block w-20 h-20 relative group cursor-pointer"
                                >
                                  <img
                                    src={imgUrl}
                                    alt="Reference"
                                    class="w-full h-full object-cover rounded border border-slate-600 group-hover:border-blue-500 transition-colors"
                                  />
                                </button>
                              {/each}
                            </div>
                          </div>
                        {/if}

                        <!-- Upload or Flip Button -->
                        {#if hasResults}
                          <button
                            on:click={() => toggleCardFlip(comm.id)}
                            class="w-full py-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded font-medium transition border border-blue-600/30"
                          >
                            👁 Click to view final results ({JSON.parse(
                              comm.final_result_images,
                            ).length} images)
                          </button>
                        {:else}
                          <div
                            class="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-slate-500 transition"
                            on:drop={(e) => handleResultDrop(comm.id, e)}
                            on:dragover={(e) => e.preventDefault()}
                          >
                            {#if uploadingResultFor === comm.id}
                              <div class="text-blue-400">Uploading...</div>
                            {:else}
                              <div class="text-slate-400 mb-2">
                                <svg
                                  class="mx-auto h-12 w-12 mb-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-width="2"
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                  />
                                </svg>
                                <p class="text-sm">
                                  Drag & drop final result images
                                </p>
                                <p class="text-xs mt-1">or</p>
                              </div>
                              <label
                                class="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer text-sm"
                              >
                                Choose Files
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  class="hidden"
                                  on:change={(e) =>
                                    handleResultFileSelect(comm.id, e)}
                                />
                              </label>
                            {/if}
                          </div>
                        {/if}

                        <!-- Date Info -->
                        <div class="grid grid-cols-2 gap-4 text-sm mt-4">
                          <div class="bg-slate-700 p-2 rounded">
                            <p class="text-slate-400">Received</p>
                            <p class="text-white font-medium">
                              {formatDate(comm.created_at)}
                            </p>
                          </div>
                          {#if comm.completion_date}
                            <div class="bg-slate-700 p-2 rounded">
                              <p class="text-slate-400">Completed</p>
                              <p class="text-white font-medium">
                                {formatDate(comm.completion_date)}
                              </p>
                            </div>
                          {/if}
                        </div>
                      </div>
                    </div>

                    <!-- BACK: Final Results -->
                    <div
                      class="flip-face back"
                      style="backface-visibility: hidden; transform: rotateY(180deg); position: absolute; top: 0; left: 0; width: 100%;"
                    >
                      <div
                        class="bg-slate-800 rounded-lg p-6 border border-slate-700"
                      >
                        <div class="flex justify-between items-center mb-4">
                          <h4 class="text-xl font-bold text-white">
                            Final Results
                          </h4>
                          <button
                            on:click={() => toggleCardFlip(comm.id)}
                            class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-medium transition"
                          >
                            ← Back to Info
                          </button>
                        </div>

                        {#if hasResults}
                          <ResultFlashcard
                            resultImages={JSON.parse(comm.final_result_images)}
                          />
                          <div class="mt-4 flex justify-between items-center">
                            <p class="text-slate-400 text-sm">
                              {JSON.parse(comm.final_result_images).length} image(s)
                            </p>
                            <label
                              class="text-blue-400 hover:text-blue-300 text-sm cursor-pointer"
                            >
                              + Add More
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                class="hidden"
                                on:change={(e) =>
                                  handleResultFileSelect(comm.id, e)}
                              />
                            </label>
                          </div>
                        {/if}
                      </div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- Right: Calendar -->
      <div>
        <h2 class="text-2xl font-bold text-white mb-4">Calendar</h2>
        <CommissionCalendar commissions={activeCommissions} {previewRange} />
      </div>
    </div>
  </div>

  <!-- Payment Modal -->
  {#if showPaymentModal}
    <div
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <div
        class="bg-slate-800 rounded-lg p-6 max-w-md w-full border border-slate-700"
      >
        <h3 class="text-xl font-bold text-white mb-4">
          Mark Commission as Paid
        </h3>
        <div class="space-y-4">
          <div>
            <label class="block text-slate-300 mb-2">Amount Paid (€)</label>
            <input
              type="number"
              step="0.01"
              bind:value={paymentAmount}
              class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              placeholder="100.00"
            />
          </div>
          <div>
            <label class="block text-slate-300 mb-2"
              >Payment Reference (Optional)</label
            >
            <input
              type="text"
              bind:value={paymentReference}
              class="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              placeholder="e.g., TXN12345"
            />
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button
            on:click={confirmPayment}
            class="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition"
          >
            Confirm Payment
          </button>
          <button
            on:click={closePaymentModal}
            class="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-medium transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Delete Modal -->
  {#if showDeleteModal}
    <div
      class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <div
        class="bg-slate-800 rounded-lg p-6 max-w-md w-full border border-slate-700"
      >
        <h3 class="text-xl font-bold text-white mb-4">Delete Commission</h3>
        <p class="text-slate-300 mb-6">
          Are you sure you want to permanently delete this commission?
          <span class="text-red-400 font-semibold"
            >This action cannot be undone.</span
          >
        </p>
        <div class="flex gap-3">
          <button
            on:click={confirmDelete}
            class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition"
          >
            Delete Permanently
          </button>
          <button
            on:click={closeDeleteModal}
            class="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded font-medium transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Image Gallery -->
  {#if showImageGallery}
    <ImageGallery
      images={galleryImages}
      initialIndex={galleryInitialIndex}
      on:close={() => (showImageGallery = false)}
    />
  {/if}
{/if}

<style>
  .flip-card {
    position: relative;
    width: 100%;
    min-height: 300px;
  }

  .flip-card.flipped {
    transform: rotateY(180deg);
  }

  .flip-face {
    width: 100%;
  }

  .flip-face.back {
    min-height: 300px;
  }
</style>
