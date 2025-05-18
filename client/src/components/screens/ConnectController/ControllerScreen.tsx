import { motion } from 'framer-motion'
import GolemHelloImg from '../../../assets/icons/GolemHello.png'

interface ConnectControllerProps {
  onConnect: () => void
}

export function ConnectController({ onConnect }: ConnectControllerProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black bg-opacity-30 backdrop-blur-sm z-50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-cream rounded-2xl p-6 flex flex-col items-center"
      >
        <img
          src={GolemHelloImg}
          alt="Golem says hello"
          className="w-48 h-48 mb-4"
        />
        <button
          onClick={onConnect}
          className="btn-cr-yellow text-xl px-6 py-4 font-bold tracking-wide rounded-[10px]"
        >
          CONNECT
        </button>
      </motion.div>
    </div>
  )
}
