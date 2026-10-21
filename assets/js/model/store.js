/**
 * 状态容器
 * --------------------------------------------------------------------------
 * 单一状态：当前选中的公司 id。
 * 所有视图（Tab、面板、操作条）都从这里派生，避免"索引 / id / DOM 数组"
 * 三份状态互相追赶。
 */

/**
 * @param {Array<{id: string}>} companies
 * @param {string} initialId
 */
export function createStore(companies, initialId) {
  const exists = (id) => companies.some((company) => company.id === id);

  let activeId = exists(initialId) ? initialId : companies[0] ? companies[0].id : null;
  const listeners = new Set();

  const store = {
    companies,

    /** 当前公司模型（找不到时退化为第一家） */
    getActive() {
      return companies.find((company) => company.id === activeId) || companies[0] || null;
    },

    getActiveId() {
      return activeId;
    },

    has: exists,

    /**
     * 切换当前公司；id 不存在或未变化时不做任何事
     * @param {string} id
     * @returns {boolean} 是否发生了切换
     */
    setActive(id) {
      if (!exists(id) || id === activeId) return false;
      activeId = id;
      const active = store.getActive();
      listeners.forEach((listener) => listener(active));
      return true;
    },

    /**
     * 订阅切换事件
     * @param {(company: object) => void} listener
     * @returns {() => void} 取消订阅
     */
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };

  return store;
}
