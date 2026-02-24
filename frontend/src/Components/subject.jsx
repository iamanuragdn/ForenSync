import './subject.css'
import icon from '../assets/subjects.png'

function Subject({name, teacher}) {
  

  return (
    <div className="subject">
        <img src={icon} alt="" className='sub-icon'/>
        <p className="sub-name">
            {name}
        </p>
        <p className="sub-teacher">
            {teacher}
        </p>
    </div>
  )
}

export default Subject