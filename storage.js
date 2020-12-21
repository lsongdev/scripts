
export const get = (key, options) => new Promise(resolve => {
  resolve(localStorage.getItem(key));
}).then(JSON.parse);

export const set = (key, value, options) => new Promise(() => {
  localStorage.setItem(key, JSON.stringify(value));
});

export const del = () => {

};

export const clear = () => {
  
};
