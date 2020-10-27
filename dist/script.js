var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var _a = require("electron"), ipcRenderer = _a.ipcRenderer, remote = _a.remote;
var fs = require("fs");
////////////////////////////////////////
// React Components
//////////////////////////////////////
var Variant = function (_a) {
    var data = _a.data, onVariantChange = _a.onVariantChange, onVariantDelete = _a.onVariantDelete;
    var variant = __assign({}, data);
    var _b = React.useState(variant.price), price = _b[0], setPrice = _b[1];
    var _c = React.useState(variant.alt), alt = _c[0], setAlt = _c[1];
    var _d = React.useState(variant.img), img = _d[0], setImg = _d[1];
    React.useEffect(function () {
        var timeout = setTimeout(function () {
            variant.price = price;
            variant.alt = alt;
            variant.img = img;
            onVariantChange(variant);
        }, 2000);
        return function () { return clearTimeout(timeout); };
    }, [price, alt, img]);
    return (<div className="variant">
      <img onClick={function (e) {
        e.stopPropagation();
        //  Todo select img from img library....
        var path = remote.dialog.showOpenDialogSync({
            title: "Select Image",
            properties: ["openFile"],
            filters: [{ name: "Images", extensions: ["jpg", "png", "gif"] }],
            defaultPath: "C:\\Development\\Web\\mali-and-family\\public\\images"
        });
        if (path === undefined || path[0] === "")
            return;
        setImg(path[0].split("\\").pop());
    }} src={abs(img)}/>
      <input name="price" className="price" type="number" value={price} onChange={function (e) { return setPrice(e.target.value); }}/>
      <input name="alt" type="text" value={alt} onChange={function (e) { return setAlt(e.target.value); }}/>
      <button className="delete" onClick={onVariantDelete}>
        &#x1f5d1;
      </button>
    </div>);
};
var ProductCard = function (_a) {
    var data = _a.data, onProductChange = _a.onProductChange, onProductDelete = _a.onProductDelete;
    var product = __assign({}, data);
    var VariantChanged = function (index, variant) {
        product.variants[index] = variant;
        //console.log(product);
        onProductChange(product);
    };
    var DeleteVariant = function (index) {
        //console.log(`Deleting Variant: ${product.variants[index]}`);
        product.variants = remove(product.variants, index);
        //console.log(product);
        onProductChange(product);
    };
    var AddVariant = function () {
        product.variants.push({
            img: "test.png",
            alt: "a blue variant",
            price: "0.00"
        });
        //console.log(product);
        onProductChange(product);
    };
    var _b = React.useState(product.name), name = _b[0], setName = _b[1];
    var _c = React.useState(product.description), description = _c[0], setDesc = _c[1];
    React.useEffect(function () {
        var timeout = setTimeout(function () {
            product.name = name;
            product.description = description;
            onProductChange(product);
        }, 2000);
        return function () { return clearTimeout(timeout); };
    }, [name, description]);
    return (<div id={product.name.toLowerCase()} className={"product"}>
      <input name="name" className="hero name m" type="text" value={name} onChange={function (e) { return setName(e.target.value); }}/>
      <textarea name="description" className="description" type="text" value={description} onChange={function (e) { return setDesc(e.target.value); }}/>
      <div className="variants">
        <h3>Variants</h3>
        {product.variants.map(function (variant, i) {
        return (<Variant data={variant} key={variant.alt + i} onVariantDelete={function () { return DeleteVariant(i); }} onVariantChange={function (newState) { return VariantChanged(i, newState); }}/>);
    })}
        <div className="variant">
          <button className="add" onClick={function () { return AddVariant(); }}>
            +
          </button>
        </div>
      </div>
      <button className="delete" onClick={onProductDelete}>
        &#x1f5d1;
      </button>
    </div>);
};
var ProductSection = function (_a) {
    var data = _a.data, onSectionChange = _a.onSectionChange, onSectionDelete = _a.onSectionDelete;
    var section = __assign({}, data);
    var ProductChanged = function (index, product) {
        section.products[index] = product;
        //console.log(section);
        onSectionChange(section);
    };
    var DeleteProduct = function (index) {
        //console.log(`Deleting Section: ${section.products[index].name}`);
        section.products = remove(section.products, index);
        //console.log(section);
        onSectionChange(section);
    };
    var AddProduct = function () {
        section.products.push({
            name: "Product Name",
            description: "Enter your description...",
            variants: []
        });
        //console.log(section);
        onSectionChange(section);
    };
    var _b = React.useState(section.title), title = _b[0], setTitle = _b[1];
    var _c = React.useState(section.altName), altName = _c[0], setAlt = _c[1];
    React.useEffect(function () {
        var timeout = setTimeout(function () {
            section.title = title;
            section.altName = altName;
            onSectionChange(section);
        }, 2000);
        return function () { return clearTimeout(timeout); };
    }, [title, altName]);
    return (<section id={section.title.toLowerCase()} className="section">
      <div className="header">
        <input type="text" className="hero l sectionName" value={title} onChange={function (e) { return setTitle(e.target.value); }}/>
        <input type="text" value={altName} onChange={function (e) { return setAlt(e.target.value); }}/>
      </div>
      <div className="products">
        <h3>Products</h3>
        {data.products.map(function (product, i) {
        return (<ProductCard data={product} key={product.name + i} onProductDelete={function () { return DeleteProduct(i); }} onProductChange={function (newState) { return ProductChanged(i, newState); }}/>);
    })}
        <div className="product">
          <button className="add" onClick={function () { return AddProduct(); }}>
            +
          </button>
        </div>
      </div>
      <button className="delete" onClick={onSectionDelete}>
        &#x1f5d1;
      </button>
    </section>);
};
var App = function (data) {
    var currentData = __assign({}, data);
    var OnStateChanged = function (newState) {
        return ipcRenderer.send("state-changed", newState);
    };
    var DeleteSection = function (index) {
        //console.log(`Deleting Section: ${currentData.main[index].title}`);
        currentData.main = remove(currentData.main, index);
        //console.log(currentData);
        OnStateChanged(currentData);
    };
    var AddSection = function () {
        currentData.main.push({
            title: "Title",
            altName: "AltTitle",
            products: []
        });
        //console.log(currentData);
        OnStateChanged(currentData);
    };
    var SectionChanged = function (index, newState) {
        currentData.main[index] = newState;
        //console.log(currentData);
        OnStateChanged(currentData);
    };
    return (<div className="App">
      <main className="editor">
        {data.main.map(function (section, index) { return (<ProductSection data={section} key={section.title + index} onSectionChange={function (newState) { return SectionChanged(index, newState); }} onSectionDelete={function () { return DeleteSection(index); }}/>); })}
        <section className="section">
          <button className="add" onClick={function () { return AddSection(); }}>
            +
          </button>
        </section>
      </main>
    </div>);
};
////////////////////////////////////////
// Helper Functions
//////////////////////////////////////
var absolutePath;
var imageNames = [];
var abs = function (imgName) { return absolutePath + "\\" + imgName; };
var remove = function (array, index) {
    var arr = array;
    var temp = arr.splice(index + 1);
    arr.pop();
    return arr.concat(temp);
};
////////////////////////////////////////
// IPC Renderer
//////////////////////////////////////
//  When JSON Def is Loaded
ipcRenderer.on("website-data", function (event, data) {
    var temp = __assign({}, data);
    console.log("===============================\nWebsite-Data: " + temp + "\n===============================");
    ReactDOM.render(<App {...data}/>, document.getElementById("root"));
});
//  When Image Directory is set
ipcRenderer.on("img-dir", function (event, data) {
    console.log("New Image Directory Attained");
    absolutePath = data;
    imageNames = fs.readdirSync(data);
});
//# sourceMappingURL=script.js.map