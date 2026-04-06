document.addEventListener('DOMContentLoaded', () => {
    const track = document.querySelector('.hero-carousel-track');
    const images = document.querySelectorAll('.hero-image');
    const dots = document.querySelectorAll('.dot');
    const btnPrev = document.querySelector('.carousel-btn-prev');
    const btnNext = document.querySelector('.carousel-btn-next');
    if (images.length === 0 || !track) return;
    
    let currentIndex = 0;
    
    function showImage(index) {
        dots[currentIndex].classList.remove('active');
        
        currentIndex = (index + images.length) % images.length;
        
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
        
        dots[currentIndex].classList.add('active');
    }
    
    btnPrev.addEventListener('click', () => showImage(currentIndex - 1));
    btnNext.addEventListener('click', () => showImage(currentIndex + 1));
    
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => showImage(index));
    });
});
