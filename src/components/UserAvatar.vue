<template>
  <div class="user-avatar">
    <el-dropdown @command="handleCommand" v-if="userInfo" trigger="click">
      <div class="avatar-wrapper">
        <el-avatar :src="userInfo.avatar" :size="32" />
        <span class="username">{{ userInfo.username }}</span>
        <el-icon class="el-icon--right"><arrow-down /></el-icon>
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="logout">退出登录</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { ArrowDown } from '@element-plus/icons-vue'

export default {
  name: 'UserAvatar',
  components: {
    ArrowDown
  },
  setup() {
    const store = useStore()
    const userInfo = computed(() => store.state.user.userInfo)

    const handleCommand = (command) => {
      if (command === 'logout') {
        store.dispatch('user/logout')
      }
    }

    return {
      userInfo,
      handleCommand
    }
  }
}
</script>

<style scoped>
.user-avatar {
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 10px;
}

.avatar-wrapper {
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.avatar-wrapper:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.username {
  color: white;
  margin: 0 8px;
  font-size: 14px;
}

.el-icon--right {
  color: white;
  font-size: 12px;
  margin-left: 0px;
}

</style> 