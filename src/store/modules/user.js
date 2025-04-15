// 最后修改记录时间 -> 2025-04-15 17:25
import { ElMessage } from 'element-plus'
import { 
  getAllModels, 
  getDefaultModel, 
  getModelById 
} from '@/config/models'
import { 
  switchModel, 
  getCurrentModel 
} from '@/api/models'

export default {
  namespaced: true,
  state: {
    userInfo: null,
    currentModel: null,
    allModels: [],
    modelSwitching: false
  },
  mutations: {
    SET_USER_INFO(state, info) {
      state.userInfo = info
      if (info) {
        localStorage.setItem('userInfo', JSON.stringify(info))
      } else {
        localStorage.removeItem('userInfo')
      }
    },
    SET_CURRENT_MODEL(state, model) {
      state.currentModel = model
    },
    SET_ALL_MODELS(state, models) {
      state.allModels = models
    },
    SET_MODEL_SWITCHING(state, status) {
      state.modelSwitching = status
    }
  },
  actions: {
    // 初始化用户信息
    initUserInfo({ commit, dispatch }) {
      // 先尝试从localStorage获取
      const savedInfo = localStorage.getItem('userInfo')
      if (savedInfo) {
        commit('SET_USER_INFO', JSON.parse(savedInfo))
      } else {
        // 如果没有，则模拟一个用户
        const mockUser = {
          userId: 'mock_001',
          username: '测试用户',
          avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
          token: 'mock_token_' + Date.now()
        }
        commit('SET_USER_INFO', mockUser)
      }
      
      // 初始化模型信息
      dispatch('initModelInfo')
    },
    
    // 初始化模型信息
    async initModelInfo({ commit }) {
      // 设置所有可用模型
      const models = getAllModels()
      commit('SET_ALL_MODELS', models)
      
      try {
        // 尝试获取当前选择的模型
        const result = await getCurrentModel()
        if (result.success && result.model) {
          commit('SET_CURRENT_MODEL', result.model)
        } else {
          // 获取失败，使用默认模型
          commit('SET_CURRENT_MODEL', getDefaultModel())
        }
      } catch (error) {
        console.error('初始化模型信息失败:', error)
        // 使用默认模型
        commit('SET_CURRENT_MODEL', getDefaultModel())
      }
    },
    
    // 切换模型
    async switchModel({ commit, state }, modelId) {
      // 如果已经是当前模型，不执行切换
      if (state.currentModel && state.currentModel.id === modelId) {
        return {
          success: true,
          model: state.currentModel,
          message: `当前已经是 ${state.currentModel.name} 模型`
        }
      }
      
      commit('SET_MODEL_SWITCHING', true)
      
      try {
        // 调用API切换模型
        const result = await switchModel(modelId)
        
        if (result.success) {
          commit('SET_CURRENT_MODEL', result.model)
          ElMessage.success(result.message)
        } else {
          ElMessage.error(`切换模型失败: ${result.error}`)
        }
        
        return result
      } catch (error) {
        console.error('切换模型出错:', error)
        ElMessage.error(`切换模型出错: ${error.message || '未知错误'}`)
        
        return {
          success: false,
          error: error.message || '切换模型失败'
        }
      } finally {
        commit('SET_MODEL_SWITCHING', false)
      }
    },
    
    // 退出登录
    logout({ commit }) {
      commit('SET_USER_INFO', null)
      ElMessage.success('您已退出登录，将引导你前往良策网络系统门户')
      // 这里模拟SSO登录页面
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    }
  },
  getters: {
    isLoggedIn: state => !!state.userInfo,
    currentModelId: state => state.currentModel?.id || 'deepseek-chat',
    availableModels: state => state.allModels,
    isModelSwitching: state => state.modelSwitching
  }
} 