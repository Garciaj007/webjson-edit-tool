const { ipcRenderer, remote } = require("electron");
const fs = require("fs");

////////////////////////////////////////
// React Components
//////////////////////////////////////

const Variant = ({ data, onVariantChange, onVariantDelete }) => {
  let variant = { ...data };

  const [price, setPrice] = React.useState(variant.price);
  const [alt, setAlt] = React.useState(variant.alt);
  const [img, setImg] = React.useState(variant.img);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      variant.price = price;
      variant.alt = alt;
      variant.img = img;
      onVariantChange(variant);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [price, alt, img]);

  return (
    <div className="variant">
      <img
        onClick={(e) => {
          e.stopPropagation();
          //  Todo select img from img library....
          const path = remote.dialog.showOpenDialogSync({
            title: "Select Image",
            properties: ["openFile"],
            filters: [{ name: "Images", extensions: ["jpg", "png", "gif"] }],
            defaultPath:
              "C:\\Development\\Web\\mali-and-family\\public\\images",
          });
          if (path === undefined || path[0] === "") return;
          setImg(path[0].split("\\").pop());
        }}
        src={abs(img)}
      />
      <input
        name="price"
        className="price"
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <input
        name="alt"
        type="text"
        value={alt}
        onChange={(e) => setAlt(e.target.value)}
      />
      <button className="delete" onClick={onVariantDelete}>
        &#x1f5d1;
      </button>
    </div>
  );
};

const ProductCard = ({ data, onProductChange, onProductDelete }) => {
  let product = { ...data };

  const VariantChanged = (index, variant) => {
    product.variants[index] = variant;
    //console.log(product);
    onProductChange(product);
  };

  const DeleteVariant = (index) => {
    //console.log(`Deleting Variant: ${product.variants[index]}`);
    product.variants = remove(product.variants, index);
    //console.log(product);
    onProductChange(product);
  };

  const AddVariant = () => {
    product.variants.push({
      img: "test.png",
      alt: "a blue variant",
      price: "0.00",
    });
    //console.log(product);
    onProductChange(product);
  };

  const [name, setName] = React.useState(product.name);
  const [description, setDesc] = React.useState(product.description);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      product.name = name;
      product.description = description;
      onProductChange(product);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [name, description]);

  return (
    <div id={product.name.toLowerCase()} className={"product"}>
      <input
        name="name"
        className="hero name m"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <textarea
        name="description"
        className="description"
        type="text"
        value={description}
        onChange={(e) => setDesc(e.target.value)}
      />
      <div className="variants">
        <h3>Variants</h3>
        {product.variants.map((variant, i) => {
          return (
            <Variant
              data={variant}
              key={variant.alt + i}
              onVariantDelete={() => DeleteVariant(i)}
              onVariantChange={(newState) => VariantChanged(i, newState)}
            />
          );
        })}
        <div className="variant">
          <button className="add" onClick={() => AddVariant()}>
            +
          </button>
        </div>
      </div>
      <button className="delete" onClick={onProductDelete}>
        &#x1f5d1;
      </button>
    </div>
  );
};

const ProductSection = ({ data, onSectionChange, onSectionDelete }) => {
  let section = { ...data };

  const ProductChanged = (index, product) => {
    section.products[index] = product;
    //console.log(section);
    onSectionChange(section);
  };

  const DeleteProduct = (index) => {
    //console.log(`Deleting Section: ${section.products[index].name}`);
    section.products = remove(section.products, index);
    //console.log(section);
    onSectionChange(section);
  };

  const AddProduct = () => {
    section.products.push({
      name: "Product Name",
      description: "Enter your description...",
      variants: [],
    });
    //console.log(section);
    onSectionChange(section);
  };

  const [title, setTitle] = React.useState(section.title);
  const [altName, setAlt] = React.useState(section.altName);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      section.title = title;
      section.altName = altName;
      onSectionChange(section);
    }, 2000);
    return () => clearTimeout(timeout);
  }, [title, altName]);

  return (
    <section id={section.title.toLowerCase()} className="section">
      <div className="header">
        <input
          type="text"
          className="hero l sectionName"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="text"
          value={altName}
          onChange={(e) => setAlt(e.target.value)}
        />
      </div>
      <div className="products">
        <h3>Products</h3>
        {data.products.map((product, i) => {
          return (
            <ProductCard
              data={product}
              key={product.name + i}
              onProductDelete={() => DeleteProduct(i)}
              onProductChange={(newState) => ProductChanged(i, newState)}
            />
          );
        })}
        <div className="product">
          <button className="add" onClick={() => AddProduct()}>
            +
          </button>
        </div>
      </div>
      <button className="delete" onClick={onSectionDelete}>
        &#x1f5d1;
      </button>
    </section>
  );
};

const App = (data) => {
  let currentData = { ...data };

  const OnStateChanged = (newState) =>
    ipcRenderer.send("state-changed", newState);

  const DeleteSection = (index) => {
    //console.log(`Deleting Section: ${currentData.main[index].title}`);
    currentData.main = remove(currentData.main, index);
    //console.log(currentData);
    OnStateChanged(currentData);
  };

  const AddSection = () => {
    currentData.main.push({
      title: "Title",
      altName: "AltTitle",
      products: [],
    });
    //console.log(currentData);
    OnStateChanged(currentData);
  };

  const SectionChanged = (index, newState) => {
    currentData.main[index] = newState;
    //console.log(currentData);
    OnStateChanged(currentData);
  };

  return (
    <div className="App">
      <main className="editor">
        {data.main.map((section, index) => (
          <ProductSection
            data={section}
            key={section.title + index}
            onSectionChange={(newState) => SectionChanged(index, newState)}
            onSectionDelete={() => DeleteSection(index)}
          />
        ))}
        <section className="section">
          <button className="add" onClick={() => AddSection()}>
            +
          </button>
        </section>
      </main>
    </div>
  );
};

////////////////////////////////////////
// Helper Functions
//////////////////////////////////////

let absolutePath;
let imageNames = [];

const abs = (imgName) => absolutePath + "\\" + imgName;

const remove = (array, index) => {
  let arr = array;
  let temp = arr.splice(index + 1);
  arr.pop();
  return arr.concat(temp);
};

////////////////////////////////////////
// IPC Renderer
//////////////////////////////////////

//  When JSON Def is Loaded
ipcRenderer.on("website-data", (event, data) => {
  let temp = {...data};
  console.log(
    `===============================\nWebsite-Data: ${temp}\n===============================`
  );
  ReactDOM.render(<App {...data} />, document.getElementById("root"));
});

//  When Image Directory is set
ipcRenderer.on("img-dir", (event, data) => {
  console.log("New Image Directory Attained");
  absolutePath = data;
  imageNames = fs.readdirSync(data);
});
