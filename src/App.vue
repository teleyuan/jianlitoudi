<template>
  <main class="app-shell">
    <section class="panel overview-panel" aria-labelledby="overviewTitle">
      <div class="section-heading">
        <div>
          <h2 id="overviewTitle">状态总览</h2>
        </div>
        <button class="primary-button add-button" type="button" @click="openAddDialog">新增投递</button>
      </div>

      <div class="overview-grid" aria-label="按状态分组汇总投递记录">
        <article
          v-for="group in groupedStatusSummary"
          :key="group.key"
          class="overview-card overview-group-card"
          :class="{ active: isGroupActive(group), expanded: isGroupExpanded(group.key) }"
        >
          <button class="overview-group-trigger" type="button" @click="toggleStatusGroup(group.key)">
            <span class="overview-group-name">{{ group.name }}</span>
            <strong>{{ group.count }}</strong>
            <small>占比 {{ group.percent }}%</small>
            <span class="expand-hint">{{ isGroupExpanded(group.key) ? '收起' : '展开' }}</span>
          </button>

          <div v-if="isGroupExpanded(group.key)" class="overview-status-list">
            <button
              v-for="item in group.children"
              :key="item.status"
              class="overview-status-item"
              type="button"
              :class="{ active: statusFilter === item.status }"
              @click="statusFilter = item.status"
            >
              <span class="status-badge" :class="getStatusClass(item.status)">{{ item.status }}</span>
              <strong>{{ item.count }}</strong>
            </button>
          </div>
        </article>
        <button
          class="overview-card overview-card-total"
          type="button"
          :class="{ active: statusFilter === '全部' }"
          @click="statusFilter = '全部'"
        >
          <span>全部状态</span>
          <strong>{{ applications.length }}</strong>
        </button>
      </div>
    </section>

    <section class="panel" aria-labelledby="listTitle">
      <div class="section-heading list-heading">
        <div>
          <h2 id="listTitle">投递列表</h2>
        </div>
        <div class="toolbar">
          <input v-model.trim="searchKeyword" type="search" placeholder="搜索公司或职位" aria-label="搜索公司或职位" />
          <select v-model="statusFilter" aria-label="按状态筛选">
            <option value="全部">全部状态</option>
            <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
          </select>
          <button class="ghost-button toolbar-button" type="button" @click="triggerImportFile">导入</button>
          <button class="ghost-button toolbar-button" type="button" @click="exportApplications">导出</button>
        </div>
      </div>

      <div class="table-wrap" :class="{ 'is-empty': filteredApplications.length === 0 }">
        <table>
          <thead>
            <tr>
              <th class="col-date">投递时间</th>
              <th class="col-company">公司名</th>
              <th class="col-position">投递职位</th>
              <th class="col-link">详情链接</th>
              <th class="col-status">投递状态</th>
              <th class="col-notes">备注</th>
              <th class="col-actions" aria-label="操作"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="application in filteredApplications" :key="application.id">
              <td class="col-date" data-label="投递时间">{{ formatDateTime(application.appliedAt) }}</td>
              <td class="col-company" data-label="公司名">{{ application.company }}</td>
              <td class="col-position" data-label="投递职位">{{ application.position }}</td>
              <td class="col-link detail-url" data-label="详情链接">
                <a v-if="application.detailUrl" :href="application.detailUrl" target="_blank" rel="noopener noreferrer">查看详情</a>
                <span v-else>-</span>
              </td>
              <td class="col-status status-cell" data-label="投递状态">
                <span class="status-badge" :class="getStatusClass(application.status)">{{ application.status }}</span>
              </td>
              <td class="col-notes notes" data-label="备注">{{ application.notes || '-' }}</td>
              <td class="col-actions" data-label="操作">
                <div class="action-buttons">
                  <button class="edit-button" type="button" @click="openEditDialog(application)">修改</button>
                  <button class="delete-button" type="button" @click="deleteApplication(application.id)">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="empty-state">
          <strong>{{ emptyMessage.title }}</strong>
          <span>{{ emptyMessage.description }}</span>
        </div>
      </div>
    </section>

    <div v-if="isDialogOpen" class="dialog-backdrop" @click.self="closeDialog">
      <section class="dialog" role="dialog" aria-modal="true" aria-labelledby="applicationDialogTitle">
        <div class="dialog-heading">
          <div>
            <p class="eyebrow">{{ dialogMode === 'add' ? 'New Record' : 'Edit Record' }}</p>
            <h2 id="applicationDialogTitle">{{ dialogTitle }}</h2>
          </div>
          <button class="icon-button" type="button" :aria-label="`关闭${dialogTitle}弹窗`" @click="closeDialog">×</button>
        </div>

        <form class="application-form dialog-form" @submit.prevent="submitDialog">
          <label>
            <span>投递时间</span>
            <input v-model="dialogForm.appliedAt" type="date" />
          </label>
          <label>
            <span>公司名</span>
            <input v-model.trim="dialogForm.company" type="text" />
          </label>
          <label>
            <span>投递职位</span>
            <input v-model.trim="dialogForm.position" type="text" />
          </label>
          <label>
            <span>详情链接</span>
            <input v-model.trim="dialogForm.detailUrl" type="text" />
          </label>
          <label>
            <span>投递状态</span>
            <select v-model="dialogForm.status">
              <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
            </select>
          </label>
          <label class="full-width">
            <span>备注</span>
            <textarea v-model.trim="dialogForm.notes" rows="4"></textarea>
          </label>
          <div class="dialog-actions full-width">
            <button class="ghost-button" type="button" @click="closeDialog">取消</button>
            <button class="primary-button dialog-save-button" type="submit">{{ dialogSubmitText }}</button>
          </div>
        </form>
      </section>
    </div>

    <input ref="importFileInput" class="hidden-file-input" type="file" accept="application/json,.json" @change="handleImportFile" />
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";

const statusOptions = [
  "简历筛选中",
  "笔试/测评",
  "一面中",
  "二面中",
  "三面中",
  "Offer",
  "简历挂",
  "一面挂",
  "二面挂",
  "三面挂",
  "已拒绝",
  "已结束",
];

const statusGroups = [
  {
    key: "submit",
    name: "投递/筛选",
    statuses: ["简历筛选中"],
  },
  {
    key: "test",
    name: "笔试测评",
    statuses: ["笔试/测评"],
  },
  {
    key: "interviewing",
    name: "面试中",
    statuses: ["一面中", "二面中", "三面中"],
  },
  {
    key: "offer",
    name: "Offer",
    statuses: ["Offer"],
  },
  {
    key: "finished",
    name: "未通过/结束",
    statuses: ["简历挂", "一面挂", "二面挂", "三面挂", "已拒绝", "已结束"],
  },
];

const applications = ref([]);
const searchKeyword = ref("");
const statusFilter = ref("全部");
const dialogForm = reactive(createEmptyForm());
const dialogMode = ref("add");
const editingApplicationId = ref("");
const isDialogOpen = ref(false);
const expandedStatusGroups = ref([]);
const importFileInput = ref(null);

const filteredApplications = computed(() => {
  const keyword = searchKeyword.value.toLowerCase();

  return [...applications.value]
    .filter((application) => {
      const matchesKeyword = [application.company, application.position, application.notes]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
      const matchesStatus = statusFilter.value === "全部" || application.status === statusFilter.value;
      return matchesKeyword && matchesStatus;
    })
    .sort((first, second) => new Date(second.appliedAt).getTime() - new Date(first.appliedAt).getTime());
});

const groupedStatusSummary = computed(() => {
  const total = applications.value.length;

  return statusGroups.map((group) => {
    const children = group.statuses.map((status) => {
      const count = applications.value.filter((application) => application.status === status).length;

      return {
        status,
        count,
      };
    });
    const count = children.reduce((sum, item) => sum + item.count, 0);

    return {
      ...group,
      count,
      percent: total === 0 ? 0 : Math.round((count / total) * 100),
      children,
    };
  });
});

const emptyMessage = computed(() => {
  if (applications.value.length === 0) {
    return {
      title: "还没有投递记录",
      description: "点击上方“新增投递”添加第一条记录吧。",
    };
  }

  return {
    title: "没有匹配的记录",
    description: "可以换个关键词或状态筛选试试。",
  };
});

const dialogTitle = computed(() => (dialogMode.value === "add" ? "新增投递" : "修改投递信息"));
const dialogSubmitText = computed(() => (dialogMode.value === "add" ? "新增投递" : "保存修改"));

function createEmptyForm() {
  return {
    appliedAt: "",
    company: "",
    position: "",
    detailUrl: "",
    status: statusOptions[0],
    notes: "",
  };
}

function resetDialogForm() {
  Object.assign(dialogForm, createEmptyForm());
}

async function loadApplications() {
  const response = await fetch("/api/applications");
  applications.value = await response.json();
}

async function saveApplications() {
  await fetch("/api/applications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(applications.value),
  });
}

function triggerImportFile() {
  importFileInput.value?.click();
}

async function handleImportFile(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    const importedText = await file.text();
    const importedApplications = JSON.parse(importedText);
    if (!Array.isArray(importedApplications)) {
      throw new Error("导入文件格式不正确，必须是数组");
    }

    const existingById = new Map(applications.value.map((application) => [application.id, application]));
    for (const application of importedApplications) {
      if (application && application.id) {
        existingById.set(application.id, application);
      }
    }

    applications.value = Array.from(existingById.values());
    await saveApplications();
  } catch (error) {
    window.alert(`导入失败：${error.message}`);
  } finally {
    event.target.value = "";
  }
}

function exportApplications() {
  const blob = new Blob([JSON.stringify(applications.value, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "applications.json";
  link.click();
  URL.revokeObjectURL(url);
}

function isGroupExpanded(groupKey) {
  return expandedStatusGroups.value.includes(groupKey);
}

function isGroupActive(group) {
  return group.statuses.includes(statusFilter.value);
}

function toggleStatusGroup(groupKey) {
  if (isGroupExpanded(groupKey)) {
    expandedStatusGroups.value = expandedStatusGroups.value.filter((key) => key !== groupKey);
    return;
  }

  expandedStatusGroups.value = [...expandedStatusGroups.value, groupKey];
}

function openAddDialog() {
  dialogMode.value = "add";
  editingApplicationId.value = "";
  resetDialogForm();
  dialogForm.appliedAt = toLocalDateInputValue(new Date());
  isDialogOpen.value = true;
}

onMounted(() => {
  loadApplications();
});

function openEditDialog(application) {
  dialogMode.value = "edit";
  editingApplicationId.value = application.id;
  Object.assign(dialogForm, {
    appliedAt: normalizeDateInputValue(application.appliedAt),
    company: application.company,
    position: application.position,
    detailUrl: application.detailUrl || "",
    status: application.status,
    notes: application.notes || "",
  });
  isDialogOpen.value = true;
}

function closeDialog() {
  isDialogOpen.value = false;
  editingApplicationId.value = "";
  resetDialogForm();
}

function submitDialog() {
  if (dialogMode.value === "add") {
    addApplication();
    return;
  }

  saveEditedApplication();
}

function addApplication() {
  applications.value.unshift({
    id: crypto.randomUUID(),
    ...dialogForm,
    createdAt: new Date().toISOString(),
  });
  saveApplications();
  closeDialog();
}

function saveEditedApplication() {
  applications.value = applications.value.map((application) => {
    if (application.id !== editingApplicationId.value) {
      return application;
    }

    return {
      ...application,
      ...dialogForm,
      updatedAt: new Date().toISOString(),
    };
  });
  saveApplications();
  closeDialog();
}

function deleteApplication(id) {
  const application = applications.value.find((item) => item.id === id);
  if (!application) {
    return;
  }

  const confirmed = window.confirm(`确定删除「${application.company} - ${application.position}」这条投递记录吗？`);
  if (!confirmed) {
    return;
  }

  applications.value = applications.value.filter((item) => item.id !== id);
  saveApplications();
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function toLocalDateInputValue(date) {
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function normalizeDateInputValue(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }

  return toLocalDateInputValue(date);
}

function getStatusClass(status) {
  return `status-${status.toLowerCase().replace(/[^\u4e00-\u9fa5a-z0-9]/g, "")}`;
}

</script>
