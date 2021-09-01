import { createContext, ReactNode, useContext, useState } from "react"
import { toast } from "react-toastify"
import { api } from "../services/api"
import { Product, Stock } from "../types"

interface CartProviderProps {
  children: ReactNode
}

interface UpdateProductAmount {
  productId: number
  amount: number
  type: "increment" | "decrement"
}

interface CartContextData {
  cart: Product[]
  addProduct: (productId: number) => Promise<void>
  removeProduct: (productId: number) => void
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void
}

const CartContext = createContext<CartContextData>({} as CartContextData)

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart")

    if (storagedCart) {
      return JSON.parse(storagedCart)
    }

    return []
  })

  const addProduct = async (productId: number) => {
    const productsResponse = await api.get("products")
    const products = productsResponse.data

    const [newProduct] = products.filter((product: Product) => product.id === productId)
    try {
      const [existentProduct] = cart.filter((product: Product) => product.id === productId)

      if (existentProduct) {
        updateProductAmount({ amount: existentProduct.amount, productId: existentProduct.id, type: "increment" })
      } else {
        setCart([...cart, { ...newProduct, amount: 1 }])
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, { ...newProduct, amount: 1 }]))
      }
    } catch (e) {
      toast.error(String(e))
    }
  }
  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter((product: Product) => product.id !== productId)
      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch (e) {
      toast.error(String(e))
    }
  }

  const updateProductAmount = async ({ productId, amount, type }: UpdateProductAmount) => {
    const response = await api.get("stock")
    const stock = response.data

    try {
      const newCart = cart.map(product => {
        if (product.id === productId) {
          if (type === "decrement") {
            product.amount -= 1
          } else if (product.amount < stock[product.id - 1].amount) {
            product.amount += 1
          } else {
            throw ("Quantidade solicitada fora do estoque!")
          }
        }
        return product
      })
      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch (e) {
      toast.error(String(e))
    }
  }

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextData {
  const context = useContext(CartContext)

  return context
}

